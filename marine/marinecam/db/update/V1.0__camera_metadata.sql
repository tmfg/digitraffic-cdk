create table camera_group (
	id				text primary key,
	name			text not null
);

create table camera (
	id 				text primary key,
	name			text not null,
	camera_group_id	text not null,
	last_updated	timestamp(0) with time zone not null
);

alter table camera add constraint camera_camera_group_fkey foreign key (camera_group_id) references camera_group(id);

create index camera_camera_group_id_fk on camera(camera_group_id);