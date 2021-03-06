# Port activity DB

To run locally first checkout and run the digitraffic-marine database from [https://github.com/tmfg/digitraffic-marine](https://github.com/tmfg/digitraffic-marine)

To run the incremental update scripts under ./update, first run the SQL scripts below as marine, then run `update-db.sh`
```
CREATE USER portactivity WITH PASSWORD 'portactivity';

GRANT portactivity TO marine;

CREATE SCHEMA portactivity AUTHORIZATION portactivity;

GRANT SELECT ON public.vessel TO portactivity;
GRANT SELECT ON public.port_call TO portactivity;
GRANT SELECT ON public.port_area_details TO portactivity;

# for tests
GRANT INSERT,UPDATE,DELETE ON public.vessel TO portactivity;
GRANT INSERT,UPDATE,DELETE ON public.port_call TO portactivity;
GRANT INSERT,UPDATE,DELETE ON public.port_area_details TO portactivity;
```
