import * as pgPromise from "pg-promise";
import {initDb} from 'digitraffic-lambda-postgres/database';
import {handler} from "../../../../lib/lambda/new-request/lambda-new-request";
const testEvent = require('../../test-event');

var db: pgPromise.IDatabase<any, any>;

beforeAll(() => {
   db = initDb('road', 'road', 'localhost:54322/road');
});

afterAll(() => {
    db.none('DELETE FROM open311_service_request');
});

beforeEach(() => {
    db.none('DELETE FROM open311_service_request');
});

test('Invalid request', async () => {
    const response = await handler(Object.assign({}, testEvent, {
        body: null
    }));

    expect(response.statusCode).toBe(400);
});
