import {DbTestCode} from "digitraffic-common/canaries/db-test-code";

const secret = process.env.secret as string;

export const handler = async () => {
    const suite = new DbTestCode(secret);

    await suite.expectRows("pilotages in last hour",
        "select count(*) from pilotage where schedule_updated > (current_timestamp - interval '1 hour')");

    return suite.resolve();
};