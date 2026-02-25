# Database migration plan

Here you'll find the migration plan and scripts used to migrate data from the legacy Oracle database to PostgreSQL on NAIS.

All scripts are found under `src/scripts`

## Step by step plan

0. Connect VS code SQL Developer Extension to Oracle database to export data from.

### Download tables from old database
1. Manually update `tableStatsExample.json` with metadata for all tables that includes the table name, number of rows, the highest and lowest ids etc. Run provided `generate-stats.sql` in SQL Developer -> SQL Worksheet to generate data.
2. Download all tables "as is" from old database to json files. This is easily done manually from "Data" tab in SQL Developer in VS Code. (Due to inline linebreak in some cells csv makes too many rows and is unreliable)
3. Take a backup of the json files if a backup of the old database doesn't already exist, and store them in a secure location.
4. Verify all json files running `json-validation.sh`, checking the number of rows and the highest and lowest ids.

### Load data to PostgreSQL
6. Copy json files (both data and validation metadata) from localhost into a tmp location in pod using kubectl exec: `kubectl cp ./data/myfile.json <pod-name>:/app/data/myfile.json` (TODO: Verify copilot command suggestion)
7. Run script `import-data-to-postgres.ts` to delete all existing data in database, load data from json files to PostgreSQL by running command in pod:
`npm exec tsx ./src/scripts/import-data-to-postgres.ts ~/Documents/STATREG_TABLES_JSON`. The script also:
 ** set the correct serial counter for all tables to ensure that autoincrement works.
 ** transforms dates to correct format and timezone
8. Run script `validate-import.ts` to verify each table in postgreSQL against the json validation files using a script. Check the number of rows and the highest and lowest ids. Script runs in pod with command: `npx tsx ./src/scripts/validate-import.ts ./docs/database-migration/tableStatsExample.json`
9. Delete json files in pod
10. Remove npm packages `JSONStream` only used for importing json

### Migrate data to new data columns in PostgreSQL
12. Add script to fill the new Division code column in the Statistics table, deriving data from the existing Division relation. (prisma migration sql?)
13. Optional: Update the approval status field(s) for Releases and Statistics if new statuses should be applied or we get any new status column.
14. Add script to fill the new ResponsiblePerson table, deriving data from the existing Contact relation. (prisma migration sql?)
15. Drop legacy tables that are no longer needed e.g. Division and Contacts. (prisma migration sql?)
