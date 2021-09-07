import {DatabaseChecker} from "digitraffic-common/canaries/database-checker";

const secret = process.env.secret as string;

export const handler = async () => {
    const checker = new DatabaseChecker(secret);

    await checker.expectRows("pilotages in last hour",
        "select count(*) from pilotage where schedule_updated > (current_timestamp - interval '1 hour')");

    return checker.done();
};