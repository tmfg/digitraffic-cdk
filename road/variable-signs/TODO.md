# Variable Signs TODO

## Bootstrap historical 3.5 data into 3.7

When the 3.7 endpoints go live, the `device_data_datex2` table will have no `DATEXII_3_7` records
until the source system starts sending them. Run the following SQL once to seed 3.7 with the current
3.5 state per device:

```sql
-- Copy current 3.5 records to 3.7 for devices that have no 3.7 record yet.
-- Safe to run multiple times — DO NOTHING skips devices already having a 3.7 record.
-- New 3.7 messages arriving via the update lambda will overwrite these bootstrapped values.
INSERT INTO device_data_datex2 (device_id, datex2, effect_date, type, version)
SELECT device_id, datex2, effect_date, type, 'DATEXII_3_7'
FROM device_data_datex2
WHERE version = 'DATEXII_3_5'
ON CONFLICT (device_id, type, version) DO NOTHING;
```

Verify what would be copied before running:

```sql
SELECT count(*), type
FROM device_data_datex2
WHERE version = 'DATEXII_3_5'
  AND (device_id, type) NOT IN (
    SELECT device_id, type FROM device_data_datex2 WHERE version = 'DATEXII_3_7'
  )
GROUP BY type;
```

