# ssbno-statreg-api

Generate types for openapi //openapi file name convention: openapi-nameoffile.yaml (new spec files must be written this way)
1. npm run types:gen (generate types per spec file) // it will overwrite existing types files


# PostgreSQL db
# This file is for testing postgreSQL locally
# Rename given sql file to statreg.sql
# Place it in the source folder next to docker-compose.yaml

1. colima start
2. docker-compose up -d
3. docker ps
4. docker-compose down -v

# Check table rows 
5. docker exec -it statreg-pg psql -U cob -d "statreg-db" -c "                                
SELECT table_schema, table_name,
       (xpath('/row/c/text()', query_to_xml(format('SELECT count(*) AS c FROM %I.%I', table_schema, table_name), false, true, '')))[1]::text::bigint AS row_count
FROM information_schema.tables
WHERE table_schema = 'statreg_data'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;"