import * as pgPromise from "pg-promise";
import {handler} from "../../../../lib/lambda/edit-requests/lambda-edit-requests";
import {newServiceRequest} from "../../testdata";
import {ServiceRequestStatus} from "../../../../lib/model/service-request";
import {insert} from "../../../../lib/db/db-requests";
import {dbTestBase} from "../../db-testutil";
const testEvent = require('../../test-event');

describe('lambda-edit-requests', dbTestBase((db: pgPromise.IDatabase<any,any>) => {

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
        const sr = Object.assign(newServiceRequest(), {
            status: ServiceRequestStatus.open
        });
        await insert(db, [sr]);
        const response = await handler(Object.assign({}, testEvent, {
            body: JSON.stringify([Object.assign({}, sr, {
                status: ServiceRequestStatus.closed
            })])
        }));

        expect(response.statusCode).toBe(200);
    });

    test('Single service request update - modify', async () => {
        const sr = Object.assign(newServiceRequest(), {
            status: ServiceRequestStatus.open
        });
        await insert(db, [sr]);
        const response = await handler(Object.assign({}, testEvent, {
            body: JSON.stringify([Object.assign({}, newServiceRequest(), {
                status: ServiceRequestStatus.open,
                description: "other description"
            })])
        }));

        expect(response.statusCode).toBe(200);
    });

}));
