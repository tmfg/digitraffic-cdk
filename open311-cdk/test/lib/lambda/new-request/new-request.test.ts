import * as pgPromise from "pg-promise";
import {initDb} from 'digitraffic-lambda-postgres/database';
import {handler} from "../../../../lib/lambda/new-request/lambda-new-request";
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

test('No body - invalid request', async () => {
    const response = await handler(Object.assign({}, testEvent, {
        body: null
    }));

    expect(response.statusCode).toBe(400);
});

test('Empty array - invalid request', async () => {
    const response = await handler(Object.assign({}, testEvent, {
        body: "[]"
    }));

    expect(response.statusCode).toBe(400);
});

test('Single service request - created', async () => {
    const response = await handler(Object.assign({}, testEvent, {
        body: JSON.stringify([newServiceRequest()])
    }));

    expect(response.statusCode).toBe(201);
});

test('Multiple service requests - created', async () => {
    const response = await handler(Object.assign({}, testEvent, {
        body: JSON.stringify([newServiceRequest(), newServiceRequest(), newServiceRequest()])
    }));

    expect(response.statusCode).toBe(201);
});
