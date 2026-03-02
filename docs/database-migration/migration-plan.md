# Database migration plan

Here you'll find the migration plan and scripts used to migrate data from the legacy Oracle database to PostgreSQL on NAIS.

All scripts are found under `src/scripts`

## Step by step plan

0. Using the [Oracle SQL Developer Extension](https://marketplace.visualstudio.com/items?itemName=Oracle.sql-developer) for the Visual Studio Code IDE, connect to the Statistikkregisteret Oracle database for table data export. Select "Custom JDBC" as Connection Type and fill in the fields, which can be found in Secret Manager in Google Cloud Platform.

### Download tables from old database
1. Manually update `tableStatsExample.json` with metadata for all tables that includes the table name, number of rows, the highest and lowest ids etc. Run the provided `generate-stats.sql` in SQL Developer -> SQL Worksheet to generate data.
2. Download all tables "as is" from the old database to JSON files. This is easily done manually from the Data tab and Export as `.json` with SQL Developer in VS Code. Make sure that the JSON files are named after the table e.g. `AUDIT_LOG.json`.
3. Take a backup of the JSON files if a backup of the old database doesn't already exist, and store them in a secure location.
4. Verify all JSON files with `json-validation.sh` by running this command in the terminal:

```
src/scripts/json-validation.sh ./docs/database-migration/tableStatsExample.json ~/Documents/STATREG_TABLES_JSON
```

### Load data to PostgreSQL
6. Skip steps 6, 8, 9, and 10 if you're only migrating to your local PostgeSQL database. Copy JSON files (both data and validation metadata) from localhost into a tmp location in pod on NAIS using kubectl exec (TODO: Verify copilot command suggestion):
```
kubectl cp ./data/myfile.json <pod-name>:/app/data/myfile.json
```

7. Run script `import-data-to-postgres.ts` to delete all existing data in database, load data from JSON files to PostgreSQL by running command in the pod or locally in the terminal:
```
npm exec tsx ./src/scripts/import-data-to-postgres.ts ~/Documents/STATREG_TABLES_JSON
``` 

  * The script also:
    * sets the correct serial counter for all tables to ensure that autoincrement works.
    * transforms dates to correct format and timezone.

8. After data loading, verify each table against the JSON validation files using a script. Check the number of rows and the highest and lowest ids.
9. Delete the copied JSON files in the pod
10. Remove npm package `JSONStream` which only used for importing JSON

### Migrate data to new data columns in PostgreSQL
12. Add script to fill the new Division code column in the Statistics table, deriving data from the existing Division relation. (prisma migration sql?)
13. Optional: Update the approval status field(s) for Releases and Statistics if new statuses should be applied or we get any new status column.
14. Add script to fill the new ResponsiblePerson table, deriving data from the existing Contact relation. (prisma migration sql?)
15. Drop legacy tables that are no longer needed e.g. Division and Contacts. (prisma migration sql?)
