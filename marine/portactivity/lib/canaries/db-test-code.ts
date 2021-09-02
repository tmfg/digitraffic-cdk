import {DbTestCode} from "digitraffic-common/canaries/db-test-code";

const secret = process.env.secret as string;

export const handler = async () => {
    const test = new DbTestCode(secret);

    test.test("select count(*) from port_call_timestamp");
    test.test("select count(*) from pilotage");

    return "Canary completed";
};