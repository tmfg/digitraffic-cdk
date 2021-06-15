alter table port_call_timestamp add column if not exists source_id text;

create index if not exists port_call_timestamp_source_idx on port_call_timestamp(event_source, source_id);