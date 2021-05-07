create table pilotage (
    id          bigint constraint pilotage_pkey primary key,
    vessel_imo  integer,
    vessel_mmsi integer,
    vessel_eta  timestamp with time zone,
    pilot_boarding_time timestamp with time zone,
    pilotage_end_time   timestamp with time zone not null,
    schedule_updated    timestamp with time zone not null,
    schedule_source     text not null,
    state       text not null constraint pilotage_state_check check (state in ('ESTIMATE', 'NOTICE', 'ORDER', 'ACTIVE', 'FINISHED')),
    vessel_name text not null,
    start_code  text not null,
    start_berth text,
    end_code    text not null,
    end_berth   text
);

create unique index pilotage_updated_key on pilotage(schedule_updated, id);