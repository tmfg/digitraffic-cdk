import * as pgPromise from "pg-promise";
import {initDb} from 'digitraffic-lambda-postgres/database';
import {insert} from "../../../lib/db/db-requests";
import {newServiceRequest} from "../testdata";

var db: pgPromise.IDatabase<any, any>

beforeAll(() => {
   db = initDb('road', 'road', 'localhost:54322/road');
});

beforeEach(() => {
    db.none('DELETE FROM open311_service_request');
});

test('Insert', async () => {
    const serviceRequests = Array.from({ length: Math.floor(Math.random() * 10) }).map(() => {
        return newServiceRequest();
    });

    await insert(db, serviceRequests);
    const count = await db.one("SELECT COUNT(*) FROM open311_service_request");

    expect(Number(count["count"])).toBe(serviceRequests.length);
    db.$pool.end();
});
