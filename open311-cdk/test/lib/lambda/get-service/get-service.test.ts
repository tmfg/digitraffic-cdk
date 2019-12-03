import * as pgPromise from "pg-promise";
import {initDb} from 'digitraffic-lambda-postgres/database';
import {handler} from "../../../../lib/lambda/get-service/lambda-get-service";
import {newService} from "../../testdata";
import {insert} from "../../../../lib/db/db-services";
import {truncate} from "../../db-testutil";
const testEvent = require('../../test-event');

var db: pgPromise.IDatabase<any, any>;

beforeAll(async () => {
   db = initDb('road', 'road', 'localhost:54322/road');
   process.env.DB_USER = 'road';
   process.env.DB_PASS = 'road';
   process.env.DB_URI = 'localhost:54322/road';
    await truncate(db);
});

afterAll(async () => {
    await truncate(db);
    db.$pool.end();
});

beforeEach(async () => {
    await truncate(db);
});

test('No service code - invalid service', async () => {
    const response = await handler(Object.assign({}, testEvent, {
        pathParameters: {},
        body: JSON.stringify(newService())
    }));

    expect(response.statusCode).toBe(400);
});

test('Get', async () => {
    const sr = newService()
    await insert(db, [sr]);

    const response = await handler(Object.assign({}, testEvent, {
        pathParameters: {service_id: sr.service_code}
    }));

    expect(response.statusCode).toBe(200);
});
