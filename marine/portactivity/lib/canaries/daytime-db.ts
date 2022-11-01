import { DatabaseChecker } from "@digitraffic/common/dist/aws/infra/canaries/database-checker";
import { EventSource } from "../model/eventsource";

export const handler = (): Promise<string> => {
    const checker = DatabaseChecker.createForRds();

    checker.notEmpty(
        "port call timestamps in last hour",
        "select count(*) from port_call_timestamp where record_time > (current_timestamp - interval '1 hour')"
    );

    checker.notEmpty(
        "Awake.AI ETA timestamps in last hour",
        `select count(*) from port_call_timestamp
                where record_time > (current_timestamp - interval '1 hour') AND
                      event_source = '${EventSource.AWAKE_AI}'`
    );

    return checker.expect();
};
