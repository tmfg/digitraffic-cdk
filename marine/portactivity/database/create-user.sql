CREATE USER portactivity WITH PASSWORD 'portactivity';

GRANT portactivity TO marine;

CREATE SCHEMA portactivity AUTHORIZATION portactivity;

GRANT SELECT ON public.vessel TO portactivity;
GRANT SELECT ON public.port_call TO portactivity;
GRANT SELECT ON public.port_area_details TO portactivity;

GRANT INSERT,UPDATE,DELETE ON public.vessel TO portactivity;
GRANT INSERT,UPDATE,DELETE ON public.port_call TO portactivity;
GRANT INSERT,UPDATE,DELETE ON public.port_area_details TO portactivity;
