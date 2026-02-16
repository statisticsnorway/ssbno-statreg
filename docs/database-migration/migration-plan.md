# Database migration plan

Plan and scripts needed to move data from old oracle database to postgresql on NAIS.

## Step by step plan

### Download
1. Make a json file per table for data validation, containing: number of rows, highest and lowest id (using script)
2. Download all tables "as is" from old database to csv files (using script)
3. Take backup of csv files (Neccessary or do we have backup of old database already? If backup: to where?)
4. Verify all csv files against json validation files (number of rows, highest and lowest id using script)

### Data manipulation
5. Rename columns according to new table names (using script)

### Prepare Postgresql to recieve data
6. Remove some constraints. As few as possible, but some constrains are impossible to keep (ie. statistic-to-statistic relation) (prisma migration?)

### Load data to Postgresql
7. Load data from csv files, one table at a time (using script)
8. Verify each table after load against json validation files (number of rows, highest and lowest id using script)

### Post migration steps in Postgres
9. Reinsert constraints removed earlier (prisma migration?)
10. Set serial counter correct for all tables to ensure autoincrement works (prisma migration sql?)

### Migrate data to new data columns in Postgres
11. Add migration to fill division code on statistics derived from existing division relation (prisma migration sql?)
12. Add migration to fill contact on new form derived from existing contacts (prisma migration sql?)
13. Drop tables no longer needed (ie. division/contacts) (prisma migration sql?)
