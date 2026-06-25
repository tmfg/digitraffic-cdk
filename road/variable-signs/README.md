# variable-signs

Public read API for variable sign data (Datex II 2.2.3, 3.5 and 3.7).

## Public API endpoints

| Endpoint | Format | Description |
|---|---|---|
| `GET /api/variable-sign/v1/signs.datex2` | Datex II 2.2.3 XML | All situations (legacy) |
| `GET /api/variable-sign/v1/signs/datex2-3.5.xml` | Datex II 3.5 XML (`sit:situationPublication`) | All situations |
| `GET /api/variable-sign/v1/statuses/datex2-3.5.xml` | Datex II 3.5 XML (`vms:VmsPublication`) | VMS controller statuses |
| `GET /api/variable-sign/v1/controllers/datex2-3.5.xml` | Datex II 3.5 XML (`vms:VmsTablePublication`) | VMS controllers |
| `GET /api/variable-sign/v1/signs/datex2-3.7.xml` | Datex II 3.7 XML (`sit:situationPublication`) | All situations |
| `GET /api/variable-sign/v1/statuses/datex2-3.7.xml` | Datex II 3.7 XML (`vms:VmsPublication`) | VMS controller statuses |
| `GET /api/variable-sign/v1/controllers/datex2-3.7.xml` | Datex II 3.7 XML (`vms:VmsTablePublication`) | VMS controllers |
| `GET /api/variable-sign/v1/images/{text}` | SVG | Sign image generated from text |

## Data source

All Datex II data is read from the `device_data_datex2` table, which stores the current
state per device (no history). Data is ingested by the **data-upload** project.

See [data-upload README](../data-upload/README.md) for the full ingest pipeline description.

## Datex II 3.5 vs 3.7

The 3.7 schemas add new modules (AfirFacilities, AfirEnergyInfrastructure, ControlledZone,
TrafficRegulation, OpenLrBinary) but the VMS and Situation schemas used by variable signs are **identical**
between versions. The 3.7 publication wrappers include five extra namespace declarations
(`afac`, `aegi`, `tro`, `cz`, `olrb`) compared to 3.5.

See [TODO.md](./TODO.md) for the SQL to bootstrap 3.7 data from 3.5 historical records.

## Legacy ingest (Datex II 2.2.3)

This project contains a separate `update-datex2` lambda that accepts Datex II 2.2.3 XML
pushed directly to the variable-signs API. It writes to `device_data_datex2` with version
`DATEXII_2_2_3`. Datex II 3.5 and 3.7 data arrives via the data-upload pipeline instead.

