# Database migration plan

Here you'll find the migration plan and scripts used to migrate data from the legacy Oracle database to PostgreSQL on NAIS.

All scripts are found under `src/scripts`

Before performing the migration, we need to allow the prisma methods deleteMany and createMany. We block these in our prisma.ts lib, because they are very hard to reliably create audit logs for and are a common source of issues. [See this PR for more information](https://github.com/statisticsnorway/ssbno-statreg/pull/147) about what to comment out. We choose to do this with simple commenting instead of feature toggles or similar in the spirit of keeping things simple.

## Step by step plan

0. Using the [Oracle SQL Developer Extension](https://marketplace.visualstudio.com/items?itemName=Oracle.sql-developer) for the Visual Studio Code IDE, connect to the Statistikkregisteret Oracle database for table data export. Select "Custom JDBC" as Connection Type and fill in the fields, which can be found in Secret Manager in Google Cloud Platform.

### Download tables from old database

1. Manually update `tableStatsExample.json` with metadata for all tables that includes the table name, number of rows, the highest and lowest ids etc. Run the provided `generate-stats.sql` in SQL Developer -> SQL Worksheet to generate data.
2. Download all tables "as is" from the old database to JSON files. This is easily done manually from the Data tab and Export as `.json` with SQL Developer in VS Code. Make sure that the JSON files are named after the table e.g. `AUDIT_LOG.json`.
3. Verify all JSON files with `json-validation.sh` by running this command in the terminal:

   ```
   ./src/scripts/json-validation.sh ../docs/database-migration/tableStatsExample.json ~/Documents/STATREG_TABLES_JSON
   ```

### Load data to PostgreSQL

4.  In `backend/src/lib/prisma.ts`, comment out the overrides that block `createMany`, `updateMany`, and `deleteMany`, so the migration scripts can use these operations.

5.  Install additional dependencies required by the migration scripts:

    ```bash
    cd backend
    npm i JSONStream
    npm i date-fns-tz
    ```

6.  (Nais only) In the Nais manifest for the application (not the database!), add higher resource limits required by the migration scripts:

    ```yaml
    resources:
      requests:
        cpu: 500m
        memory: 4Gi
      limits:
        cpu: 500m
        memory: 4Gi
    ```

7.  (Nais only) Open and merge a PR for the above changes and ensure it's deployed to Nais.

8.  (Nais only) Ensure you are connected to Naisdevice and logged in to Nais. See [Naisdevice](https://doc.nais.io/operate/naisdevice/how-to/install/) and [Nais login](https://cli.nais.io/#getting-started).

9.  (Nais only) Copy the JSON files (both data and validation metadata) from localhost to a temporary location in the pod on NAIS using the [kubernetes CLI](https://kubernetes.io/docs/tasks/tools/#kubectl).

    Get pod name:

    ```
    kubectl get pods -n ssbno
    ```

    Copy the JSON folder into the pod (replace with the actual pod name)

    ```
    kubectl cp ~/Documents/STATREG_TABLES_JSON ssbno-statreg-77ccd46996-qsk9d:/tmp
    ```

    Copy tableStats into the pod (replace with the actual pod name)

    ```
    kubectl cp ~/repos/ssbno-statreg/docs/database-migration/tableStatsExample.json ssbno-statreg-5665547945-nvjpb:/tmp
    ```

10. (Nais only) Open a shell in the same pod, and complete the remaining steps there. We recommend using [`k9s`](https://k9scli.io/topics/install/), which lets you navigate through the list of pods and press `s` to open a shell.

11. `cd` into the `backend` directory and run the below scripts there.

12. Delete all existing data in the database and load data from JSON files into PostgreSQL:

    ```
    npm exec tsx ./src/scripts/import-data-to-postgres.ts /tmp/STATREG_TABLES_JSON
    ```

    The script also:

    - sets the correct serial counter for all tables to ensure that autoincrement works.
    - transforms dates to the correct format and timezone.

13. Verify each table in PostgreSQL against the JSON validation files:

    ```
    npx tsx ./src/scripts/validate-import.ts /tmp/tableStatsExample.json
    ```

    This checks the number of rows and the highest and lowest IDs.

14. (Nais only) Delete the copied JSON files.

### Migrate data to new data columns in PostgreSQL

15. Fill in missing division codes:

    ```
    npx tsx ./src/scripts/addDivisionCodeToStatistic.ts
    ```

16. (Optional) Update the approval status field(s) for Releases and Statistics if new statuses should be applied or we get any new status column. No script generated since current migration supports existing data fields. Double check that this still applies before running migration.

17. Fill the new ResponsiblePerson table, deriving data from the existing Contact relation:

    ```
    npx tsx ./src/scripts/addResponsiblePersonFromOldContact.ts
    ```

18. Set consistent class_names in audit_log table:

    ```
    npx tsx ./src/scripts/rewriteAuditLogClassNames.ts
    ```

19. Set consistent event_names in audit_log table:

    ```
    npx tsx ./src/scripts/rewriteAuditLogEventNames.ts
    ```

20. Revert Nais manifest and `backend/src/lib/prisma.ts`. Remove the installed packages. (Open and merge a PR to revert the changes in Nais.)

21. Drop legacy tables that are no longer needed e.g. Division and Contacts. Drop assosiated columns with dropped tables as well. This can be done in a PR with an adjustment of Prisma schema a while after data migration.
