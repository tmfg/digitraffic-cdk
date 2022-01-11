import {DatabaseChecker} from "digitraffic-common/aws/infra/canaries/database-checker";

export const handler = (): Promise<string> => {
    const checker = DatabaseChecker.create();

    checker.notEmpty("pilotages in last hour",
        "select count(*) from pilotage where schedule_updated > (current_timestamp - interval '1 hour')");

    // MMSI filter: several port calls with MMSI of 0 exist and cannot be saved into port activity (this will probably change)
    // timestamp filter: several port calls' timestamps are hundreds of years in the future..
    checker.empty('port calls equivalent to Portnet', `
        SELECT count(*) FROM public.port_call pc
        WHERE
        pc.mmsi != 0 AND
        pc.port_call_id NOT IN (
            SELECT portcall_id FROM port_call_timestamp
        )
        AND pc.port_call_timestamp BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 DAY'
        `.trim());

    return checker.expect();
};
