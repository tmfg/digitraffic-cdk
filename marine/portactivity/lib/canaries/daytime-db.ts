import {DatabaseChecker} from "digitraffic-common/canaries/database-checker";

const secret = process.env.secret as string;

export const handler = async () => {
    const checker = new DatabaseChecker(secret);

    await checker.expectRows("port_call_timestamps in last hour",
        "  select count(*) from port_call_timestamp where record_time > (current_timestamp - interval '1 hour');");

    return checker.done();
};