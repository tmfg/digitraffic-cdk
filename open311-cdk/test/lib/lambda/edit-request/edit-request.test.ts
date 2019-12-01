import * as pgPromise from "pg-promise";
import {initDb} from 'digitraffic-lambda-postgres/database';
import {handler} from "../../../../lib/lambda/edit-request/lambda-edit-request";
import {newServiceRequest} from "../../testdata";
import {ServiceRequestStatus} from "../../../../lib/model/service-request";
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

test('Single service request update - delete', async () => {
    const response = await handler(Object.assign({}, testEvent, {
        body: JSON.stringify([Object.assign({}, newServiceRequest(), {
            status: ServiceRequestStatus.closed
        })])
    }));

    expect(response.statusCode).toBe(200);
});

test('Single service request update - modify', async () => {
    const response = await handler(Object.assign({}, testEvent, {
        body: JSON.stringify([Object.assign({}, newServiceRequest(), {
            status: ServiceRequestStatus.open,
            description: "other description"
        })])
    }));

    expect(response.statusCode).toBe(200);
});
