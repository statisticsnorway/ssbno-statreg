#!/usr/bin/env bash
set -Eeuo pipefail

JSON_PATH="$1"
JSON_DIR="$2"

if [[ -z "$JSON_PATH" || -z "$JSON_DIR" ]]; then
  echo "Usage: $0 path/to/tables.json path/to/json_folder"
  exit 1
fi

[[ -f "$JSON_PATH" ]] || { echo "ERROR: JSON metadata not found"; exit 1; }
[[ -d "$JSON_DIR"   ]] || { echo "ERROR: JSON folder not found"; exit 1; }

# ---- fixed tables: 12 total ----
TABLES=(
  "AUDIT_LOG"
  "FREKVENS"
  "KALENDER_DATO"
  "KONTAKT"
  "KORTNAVN"
  "PUBLISERING"
  "REGIONALT_NIVA"
  "SEKSJON"
  "STATISTIKK"
  "STATISTIKK_KONTAKTER"
  "STATISTIKK_REGIONALE_NIVAER"
  "VARIANT"
)

echo "=== VALIDATION STARTED ==="

get_json_meta() {
  table="$1" key="$2"
  jq -r --arg t "$table" --arg k "$key" \
     '.[] | select(.old_table_name == $t) | .[$k]' \
     "$JSON_PATH"
}

for TABLE in "${TABLES[@]}"; do
  JSON_FILE="$JSON_DIR/$TABLE.json"

  EXPECTED_ROWS="$(get_json_meta "$TABLE" "num_rows")"
  EXPECTED_LOW="$( get_json_meta "$TABLE" "id_low_value")"
  EXPECTED_HIGH="$(get_json_meta "$TABLE" "id_high_value")"
  NAME_ID_FIELD_OLD="$(get_json_meta "$TABLE" "old_id_column_name")"

  echo ""
  echo "Validating: $TABLE"

  if [[ ! -f "$JSON_FILE" ]]; then
    echo " ❌ File not found"
    continue
  fi

  # ---------------------------
  # Row count
  # ---------------------------
  ACTUAL_ROWS=$(jq '.results[0].items | length' "$JSON_FILE")

  if [[ "$ACTUAL_ROWS" -eq "$EXPECTED_ROWS" ]]; then
    # echo " - Row count PASS"
    ROW_OK=1
  else
    echo " - Row count FAIL: expected $EXPECTED_ROWS, got $ACTUAL_ROWS"
    ROW_OK=0
  fi

  # ---------------------------
  # Min/max ID
  # ---------------------------

  # Extract all valid numeric IDs as strings, one per line

  ALL_IDS=$(
    jq -r --arg ident "$NAME_ID_FIELD_OLD" '
      .results[].items[]?
      | .[$ident]
      | tostring
      | select(test("^[0-9]+$"))
    ' "$JSON_FILE"
  )


  # Now compute min and max separately
  MIN_ID=$(printf "%s\n" "$ALL_IDS" | jq -s 'map(tonumber) | min')
  MAX_ID=$(printf "%s\n" "$ALL_IDS" | jq -s 'map(tonumber) | max')


  if [[ "$MIN_ID" == "null" || "$MAX_ID" == "null" ]]; then
    echo " - Could not compute min/max → FAIL"
    ID_OK=0
  elif [[ "$MIN_ID" == "$EXPECTED_LOW" && "$MAX_ID" == "$EXPECTED_HIGH" ]]; then
    # echo " - ID range PASS"
    ID_OK=1
  else
    echo " - ID range FAIL: expected $EXPECTED_LOW-$EXPECTED_HIGH but got $MIN_ID-$MAX_ID"
    ID_OK=0
  fi

  # ---------------------------
  # Final result for table
  # ---------------------------
  if [[ "$ROW_OK" -eq 1 && "$ID_OK" -eq 1 ]]; then
    echo " ✔ $TABLE OK"
  else
    echo " ❌ $TABLE FAIL"
  fi
done

echo ""
echo "=== VALIDATION COMPLETE ==="
``
