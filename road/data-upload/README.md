# data-upload

Receives and processes incoming Datex II messages for road domain services,
including variable signs.

## Datex II ingest pipeline

```
External source (Fintraffic Road)
    │
    │  POST /api/data-upload/datex2  (JSON body)
    ▼
upload-datex2 lambda
    │  Validates payload, inserts each message into data_incoming
    │  with status='NEW', then sends an SQS trigger message
    ▼
data_incoming table
    │  Columns: message_id, source, version, type, data, status, created_at
    │  Versions: "2.2.3", "3.5", "3.7"
    │  Types:    VMS_DATEX2_XML, VMS_DATEX2_METADATA_XML
    ▼
handle-new-messages lambda  (triggered by SQS)
    │  Reads status='NEW' rows, dispatches by version:
    │
    ├── version "2.2.3"  →  parseSituations223()
    │                    →  device_data_datex2  (version=DATEXII_2_2_3, type=SITUATION)
    │
    ├── version "3.5"    →  parseDatex35()
    │                    →  device_data_datex2  (version=DATEXII_3_5, type=SITUATION|CONTROLLER|CONTROLLER_STATUS)
    │
    └── version "3.7"    →  parseDatex37()
                         →  device_data_datex2  (version=DATEXII_3_7, type=SITUATION|CONTROLLER|CONTROLLER_STATUS)

    After processing, row status is updated to 'PROCESSED' or 'FAILED'.
    Rows older than 7 days are deleted by the delete-old-messages lambda.
```

## device_data_datex2 table

Stores the **current state** per device — no history. Unique key is `(device_id, type, version)`.
Each incoming message overwrites the previous value for that device+type+version combination.

This table is the data source for the **variable-signs** read API.
See [variable-signs README](../variable-signs/README.md) for the public API endpoints.

## Old ingest path (Datex II 2.2.3)

The **variable-signs** project has a separate legacy `update-datex2` lambda that accepts Datex II 2.2.3
XML pushed directly (not via data-upload). It writes to the same `device_data_datex2` table with
version `DATEXII_2_2_3`.

