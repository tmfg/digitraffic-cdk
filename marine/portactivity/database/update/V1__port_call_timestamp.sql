CREATE SEQUENCE IF NOT EXISTS seq_port_call_timestamps;

create table port_call_timestamp
(
    id bigint default nextval('seq_port_call_timestamps') not null
        constraint port_call_timestamp_pkey
        primary key,
    event_type text not null
        constraint port_call_timestamp_type_check
        check (event_type IN (
            'ATA',
            'ATB',
            'ATD',
            'ETA',
            'ETD'
        )),
    event_time timestamp(0) with time zone not null,
    event_time_confidence_lower text,
    event_time_confidence_lower_diff integer,
    event_time_confidence_upper text,
    event_time_confidence_upper_diff integer,
    event_source text not null,
    record_time timestamp(0) with time zone not null,
    location_locode varchar(5) not null,
    location_terminal text,
    location_berth text,
    location_berth_position text,
    location_ship_side text,
    ship_mmsi numeric(10) not null,
    ship_imo numeric(10) not null,
    portcall_id numeric(10) not null
);

alter table port_call_timestamp owner to portactivity;

create index port_call_timestamp_locode_record_time_idx
    on port_call_timestamp (location_locode, record_time);

create unique index port_call_timestamp_update_key
    on port_call_timestamp (ship_mmsi, ship_imo, event_source, location_locode, event_type, event_time, record_time, portcall_id);

comment on index port_call_timestamp_update_key is 'This unique key is used when inserting/updating to find conflicts';
