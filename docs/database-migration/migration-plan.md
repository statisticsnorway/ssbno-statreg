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
6. Change release time with correct timezone (using script)

### Prepare Postgresql to recieve data
7. Remove some constraints. As few as possible, but some constrains are impossible to keep (ie. statistic-to-statistic relation) (prisma migration?)

### Load data to Postgresql
8. Load data from csv files, one table at a time (using script)
9. Make sure columns that should be dropped is not making errors or is imported
10. Verify each table after load against json validation files (number of rows, highest and lowest id using script)

### Post migration steps in Postgres
11. Reinsert constraints removed earlier (prisma migration?)
12. Set serial counter correct for all tables to ensure autoincrement works (prisma migration sql?)

### Migrate data to new data columns in Postgres
13. Add migration to fill division code on statistics derived from existing division relation (prisma migration sql?)
14. Change or set approval status if this property is changed
15. Add migration to fill contact on new form derived from existing contacts (prisma migration sql?)
16. Drop tables no longer needed (ie. division/contacts) (prisma migration sql?)
