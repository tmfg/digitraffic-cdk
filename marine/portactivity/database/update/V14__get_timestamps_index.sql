create unique index if not exists port_call_timestamp_find_timestamps_key on port_call_timestamp(location_locode, event_type, event_source, ship_mmsi, ship_imo, portcall_id, event_time, record_time);
