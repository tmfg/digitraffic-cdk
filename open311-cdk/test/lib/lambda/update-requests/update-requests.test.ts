import * as pgPromise from "pg-promise";
import {handler} from "../../../../lib/lambda/update-requests/lambda-update-requests";
import {newServiceRequest} from "../../testdata";
import {dbTestBase, insertServiceRequest} from "../../db-testutil";
import {ServiceRequestStatus} from "../../../../lib/model/service-request";
const testEvent = require('../../test-event');

describe('update-requests', dbTestBase((db: pgPromise.IDatabase<any,any>) => {

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

        expect(response.statusCode).toBe(200);
    });

    test('Multiple service requests - created', async () => {
        const response = await handler(Object.assign({}, testEvent, {
            body: JSON.stringify([newServiceRequest(), newServiceRequest(), newServiceRequest()])
        }));

        expect(response.statusCode).toBe(200);
    });

    test('Single service request update - delete', async () => {
        const sr = newServiceRequest();
        await insertServiceRequest(db, [sr]);

        const response = await handler(Object.assign({}, testEvent, {
            body: JSON.stringify([Object.assign({}, sr, {
                status: ServiceRequestStatus.closed
            })])
        }));

        expect(response.statusCode).toBe(200);
    });

    test('Single service request update - modify', async () => {
        const sr = newServiceRequest();
        await insertServiceRequest(db, [sr]);

        const response = await handler(Object.assign({}, testEvent, {
            body: JSON.stringify([Object.assign({}, newServiceRequest(), {
                status: ServiceRequestStatus.open,
                description: "other description"
            })])
        }));

        expect(response.statusCode).toBe(200);
    });

}));
