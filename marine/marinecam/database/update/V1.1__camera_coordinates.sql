alter table camera add column location geography(point, 4326);

update camera set location = 'POINT(0 0)';

alter table camera alter column location set not null;