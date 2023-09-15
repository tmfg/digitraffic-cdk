alter table port_call_timestamp
    add constraint check_allowed_null_portcall_id check (portcall_id is not null or (portcall_id is null and event_source = 'Awake.AI Pred'));
