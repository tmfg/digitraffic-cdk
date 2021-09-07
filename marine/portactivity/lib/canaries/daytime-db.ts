import {DatabaseChecker} from "digitraffic-common/canaries/database-checker";
import {EventSource} from "../model/eventsource";

const secret = process.env.secret as string;

export const handler = async () => {
    const checker = new DatabaseChecker(secret);

    await checker.expect([
        {
            name: 'port call timestamps in last hour',
            sql: "select count(*) from port_call_timestamp where record_time > (current_timestamp - interval '1 hour')",
            minRows: 1
        },
        {
            name: 'Awake.AI ETA timestamps in last hour',
            sql: `
                select count(*) from port_call_timestamp
                where record_time > (current_timestamp - interval '1 hour') AND
                      event_source = ${EventSource.AWAKE_AI}`,
            minRows: 1
        }
    ]);

    return checker.done();
};
