create index if not exists port_call_timestamp_record_time_idx on port_call_timestamp(
    location_locode,
    ship_mmsi,
    event_source,
    portcall_id,
    record_time
);
