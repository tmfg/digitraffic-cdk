CREATE USER marinecam WITH PASSWORD 'marinecam';

GRANT marinecam TO marine;

CREATE SCHEMA marinecam AUTHORIZATION marinecam;
