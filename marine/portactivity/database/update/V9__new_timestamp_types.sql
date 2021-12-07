alter table port_call_timestamp drop constraint port_call_timestamp_type_check;
alter table port_call_timestamp
    add constraint port_call_timestamp_type_check
        check (event_type IN (
                              'ATA',
                              'ATB',
                              'ATD',
                              'ETA',
                              'ETB',
                              'ETD',
                              'ETP',
                              'RPS',
                              'PPS',
                              'APS',
                              'APC'
            ));
