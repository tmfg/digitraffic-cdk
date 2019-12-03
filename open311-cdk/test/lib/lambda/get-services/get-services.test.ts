import * as pgPromise from "pg-promise";
import {initDb} from 'digitraffic-lambda-postgres/database';
import {handler} from "../../../../lib/lambda/get-services/lambda-get-services";
import {insert} from "../../../../lib/db/db-services";
import {newService} from "../../testdata";
import {truncate} from "../../db-testutil";
const testEvent = require('../../test-event');

var db: pgPromise.IDatabase<any, any>;

beforeAll(() => {
   db = initDb('road', 'road', 'localhost:54322/road');
   process.env.DB_USER = 'road';
   process.env.DB_PASS = 'road';
   process.env.DB_URI = 'localhost:54322/road';
});

afterAll(async () => {
    await truncate(db);
    db.$pool.end();
});

beforeEach(async () => {
    await truncate(db);
});

test('status is ok', async () => {
    const response = await handler(testEvent);

    expect(response.statusCode).toBe(200);
});

test('no services', async () => {
    const response = await handler(testEvent);

    expect(JSON.parse(response.body)).toMatchObject([]);
});

test('some service services', async () => {
    const services =
        Array.from({ length: Math.floor(Math.random() * 10) }).map(() => newService());
    await insert(db, services);

    const response = await handler(testEvent);

    expect(JSON.parse(response.body).length).toBe(services.length);
});
