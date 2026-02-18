#!/usr/bin/env bash

# Command to run in terminal:
# ./csv-validation.sh /path/to/tables.json /path/to/csv_directory

# -------------------------------
# Validate CSVs based on JSON spec
# -------------------------------

if [ $# -ne 2 ]; then
    echo "Usage: $0 path/to/tables.json path/to/csv_folder"
    exit 1
fi

JSON_PATH="$1"
CSV_DIR="$2"

if [ ! -f "$JSON_PATH" ]; then
    echo "ERROR: JSON file not found: $JSON_PATH"
    exit 1
fi

if [ ! -d "$CSV_DIR" ]; then
    echo "ERROR: CSV directory not found: $CSV_DIR"
    exit 1
fi

echo "=== CSV VALIDATION STARTED ==="

# Loop through each JSON object
jq -c '.[]' "$JSON_PATH" | while read -r spec; do
    TABLE=$(echo "$spec" | jq -r '.old_table_name')
    CSV_FILE="$CSV_DIR/$TABLE.csv"
    ID_COL=$(echo "$spec" | jq -r '.old_id_column_name')
    EXPECTED_ROWS=$(echo "$spec" | jq -r '.num_rows')
    ID_LOW=$(echo "$spec" | jq -r '.id_low_value')
    ID_HIGH=$(echo "$spec" | jq -r '.id_high_value')

    echo ""
    echo "Validating: $TABLE"
    echo "CSV file: $CSV_FILE"

    if [ ! -f "$CSV_FILE" ]; then
        echo " ❌ File not found"
        continue
    fi

    # --- Count rows ---
    ACTUAL_ROWS=$(wc -l < "$CSV_FILE")
    # subtract 1 for the header
    ACTUAL_ROWS=$((ACTUAL_ROWS - 1))

    if [ "$ACTUAL_ROWS" -eq "$EXPECTED_ROWS" ]; then
        echo " - Row count OK ($ACTUAL_ROWS)"
        ROW_OK=1
    else
        echo " - Row count FAIL: expected $EXPECTED_ROWS, found $ACTUAL_ROWS"
        ROW_OK=0
    fi

    # --- Check ID column exists ---
    HEADER=$(head -n 1 "$CSV_FILE")

    # Remove double-quotes from header before processing
    HEADER_CLEAN=$(echo "$HEADER" | tr -d '"')

    # Find column index (1-based)
    COL_INDEX=$(echo "$HEADER_CLEAN" | awk -v col="$ID_COL" '
        BEGIN {FS=","}
        {
            for (i=1; i<=NF; i++) {
                if ($i == col) {
                    print i
                }
            }
        }')

    if [ -z "$COL_INDEX" ]; then
        echo " - ID column '$ID_COL' not found -> FAIL"
        COL_OK=0
    else
        echo " - ID column found at position $COL_INDEX -> OK"
        COL_OK=1
    fi

    # --- ID values match exactly ---
    if [ "$COL_OK" -eq 1 ]; then
        MIN_ID=$(tail -n +2 "$CSV_FILE" | cut -d',' -f"$COL_INDEX" | sort -n | head -n 1)
        MAX_ID=$(tail -n +2 "$CSV_FILE" | cut -d',' -f"$COL_INDEX" | sort -n | tail -n 1)

        if [ "$MIN_ID" -eq "$ID_LOW" ] && [ "$MAX_ID" -eq "$ID_HIGH" ]; then
            echo " - ID exact match OK (min=$MIN_ID, max=$MAX_ID)"
            ID_OK=1
        else
            echo " - ID match FAIL: expected $ID_LOW–$ID_HIGH, got $MIN_ID–$MAX_ID"
            ID_OK=0
        fi
    else
        ID_OK=0
    fi

    # --- Final status ---
    if [ "$ROW_OK" -eq 1 ] && [ "$COL_OK" -eq 1 ] && [ "$ID_OK" -eq 1 ]; then
        echo " ✔ TABLE $TABLE: OK"
    else
        echo " ❌ TABLE $TABLE: FAIL"
    fi

done

echo ""
echo "=== VALIDATION COMPLETE ==="
