-- Repair legacy SA (Sammenslått) relationship data.
--
-- Old (incorrect) direction: the statistic that continues the merged statistic
-- stored the FK: other.related_statistic_id = sa.id
--
-- New (correct) direction: the SA statistic itself stores the FK:
-- sa.related_statistic_id = other.id, and other.related_statistic_id is cleared.
--
-- Only statistics with status = 'SA' and a NULL related_statistic_id are considered.
-- Unrelated relationships (e.g. IA -> A) are left untouched.
DO $$
DECLARE
  sa_row RECORD;
  incoming_count INTEGER;
  incoming_id INTEGER;
BEGIN
  FOR sa_row IN
    SELECT id FROM statreg."Statistic" WHERE status = 'SA' AND related_statistic_id IS NULL
  LOOP
    SELECT COUNT(*), MIN(id)
    INTO incoming_count, incoming_id
    FROM statreg."Statistic"
    WHERE related_statistic_id = sa_row.id;

    IF incoming_count = 0 THEN
      RAISE EXCEPTION 'Migration failed: SA statistic % has no incoming legacy relationship to repair.', sa_row.id;
    ELSIF incoming_count > 1 THEN
      RAISE EXCEPTION 'Migration failed: SA statistic % has % incoming legacy relationships, expected exactly 1.', sa_row.id, incoming_count;
    END IF;

    UPDATE statreg."Statistic" SET related_statistic_id = incoming_id WHERE id = sa_row.id;
    UPDATE statreg."Statistic" SET related_statistic_id = NULL WHERE id = incoming_id;
  END LOOP;
END $$;

-- Enforce that an SA (Sammenslått) statistic always has a related statistic.
ALTER TABLE "statreg"."Statistic"
  ADD CONSTRAINT "Statistic_sa_requires_related_statistic" CHECK (status <> 'SA' OR related_statistic_id IS NOT NULL);
