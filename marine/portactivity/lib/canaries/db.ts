import {DatabaseChecker} from "digitraffic-common/canaries/database-checker";
import {SECRET_ID} from "digitraffic-common/model/lambda-environment";

const secretId = process.env[SECRET_ID] as string;

export const handler = async () => {
    const checker = new DatabaseChecker(secretId);

    return checker.expect([
        {
            name: "pilotages in last hour",
            sql: "select count(*) from pilotage where schedule_updated > (current_timestamp - interval '1 hour')"
        }
        ]);
};
