import * as pgPromise from "pg-promise";
import {handler} from "../../../../lib/lambda/edit-request/lambda-edit-request";
import {newServiceRequest} from "../../testdata";
import {ServiceRequestStatus} from "../../../../lib/model/service-request";
import {insert} from "../../../../lib/db/db-requests";
const testEvent = require('../../test-event');
import {dbTestBase} from "../../db-testutil";

describe('lambda-edit-request', dbTestBase((db: pgPromise.IDatabase<any,any>) => {

    test('No body - invalid request', async () => {
        const response = await handler(Object.assign({}, testEvent, {
            body: null
        }));

        expect(response.statusCode).toBe(400);
    });

    test('No request_id - invalid request', async () => {
        const response = await handler(Object.assign({}, testEvent, {
            pathParameters: {},
            body: JSON.stringify(newServiceRequest())
        }));

        expect(response.statusCode).toBe(400);
    });

    test('Edit', async () => {
        const sr = Object.assign(newServiceRequest(), {
            status: ServiceRequestStatus.open
        });
        await insert(db, [sr]);

        const updateServiceRequest = newServiceRequest();
        // @ts-ignore
        delete updateServiceRequest.service_request_id;
        const response = await handler(Object.assign({}, testEvent, {
            pathParameters: {request_id: sr.service_request_id},
            body: JSON.stringify(updateServiceRequest)
        }));

        expect(response.statusCode).toBe(200);
    });

}));
