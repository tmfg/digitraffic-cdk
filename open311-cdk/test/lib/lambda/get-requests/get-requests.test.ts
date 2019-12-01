import * as pgPromise from "pg-promise";
import {initDb} from 'digitraffic-lambda-postgres/database';
import {handler} from "../../../../lib/lambda/get-requests/lambda-get-requests";
import {insert} from "../../../../lib/db/db-requests";
import {newServiceRequest} from "../../testdata";
const testEvent = require('../../test-event');

var db: pgPromise.IDatabase<any, any>;

beforeAll(() => {
   db = initDb('road', 'road', 'localhost:54322/road');
   process.env.DB_USER = 'road';
   process.env.DB_PASS = 'road';
   process.env.DB_URI = 'localhost:54322/road';
});

afterAll(() => {
    db.none('DELETE FROM open311_service_request');
    db.$pool.end();
});

beforeEach(() => {
    db.none('DELETE FROM open311_service_request');
});

test('status is ok', async () => {
    const response = await handler(testEvent);

    expect(response.statusCode).toBe(200);
});

test('no service requests', async () => {
    const response = await handler(testEvent);

    expect(JSON.parse(response.body)).toMatchObject([]);
});

test('some service requests', async () => {
    const serviceRequests =
        Array.from({ length: Math.floor(Math.random() * 10) }).map(() => newServiceRequest());
    await insert(db, serviceRequests);

    const response = await handler(testEvent);

    expect(JSON.parse(response.body).length).toBe(serviceRequests.length);
});
