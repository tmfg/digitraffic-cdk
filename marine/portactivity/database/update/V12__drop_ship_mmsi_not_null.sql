alter table port_call_timestamp alter column ship_mmsi drop not null;
create unique index port_call_timestamp_update_key_new
    on port_call_timestamp (ship_imo, event_source, location_locode, event_type, event_time, record_time, portcall_id);
drop index port_call_timestamp_update_key;
alter index port_call_timestamp_update_key_new rename to port_call_timestamp_update_key;
