# Marinecam DB

To run locally first checkout and run the digitraffic-marine database from
[https://github.com/tmfg/digitraffic-marine](https://github.com/tmfg/digitraffic-marine)

To run the incremental update scripts under ./update, first run the SQL scripts
below as marine, then run `update-db.sh`

```
CREATE USER marinecam WITH PASSWORD 'marinecam';

GRANT marinecam TO dt_superuser;

CREATE SCHEMA marinecam AUTHORIZATION marinecam;
```
