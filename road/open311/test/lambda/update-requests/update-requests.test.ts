import * as pgPromise from "pg-promise";
import {handler} from "../../../lib/lambda/update-requests/lambda-update-requests";
import {newServiceRequest, newServiceRequestWithExtensionsDto} from "../../testdata";
import {dbTestBase, insertServiceRequest} from "../../db-testutil";
import {ServiceRequestStatus} from "../../../lib/model/service-request";
import {toServiceRequestWithExtensions} from "../../../lib/service/requests";
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

    test('Invalid request', async () => {
        const req = newServiceRequestWithExtensionsDto();
        (req as any).requested_datetime = '';

        await expect(handler(Object.assign({}, testEvent, {
            body: JSON.stringify([req])
        }))).rejects.toThrow();
    });

    test('Single service request - created', async () => {
        const response = await handler(Object.assign({}, testEvent, {
            body: JSON.stringify([newServiceRequestWithExtensionsDto()])
        }));

        expect(response.statusCode).toBe(200);
    });

    test('Single service request without extended_attributes - created', async () => {
        const response = await handler(Object.assign({}, testEvent, {
            body: JSON.stringify([newServiceRequest()])
        }));

        expect(response.statusCode).toBe(200);
    });

    test('Multiple service requests - created', async () => {
        const response = await handler(Object.assign({}, testEvent, {
            body: JSON.stringify([newServiceRequestWithExtensionsDto(), newServiceRequestWithExtensionsDto(), newServiceRequestWithExtensionsDto()])
        }));

        expect(response.statusCode).toBe(200);
    });

    test('Single service request update - delete', async () => {
        const sr = newServiceRequestWithExtensionsDto();
        await insertServiceRequest(db, [toServiceRequestWithExtensions(sr)]);

        const response = await handler(Object.assign({}, testEvent, {
            body: JSON.stringify([Object.assign({}, sr, {
                status: ServiceRequestStatus.closed
            })])
        }));

        expect(response.statusCode).toBe(200);
    });

    test('Single service request update - modify', async () => {
        const sr = newServiceRequestWithExtensionsDto();
        await insertServiceRequest(db, [toServiceRequestWithExtensions(sr)]);
        const changeSr = {...newServiceRequestWithExtensionsDto(), ...{
            status: ServiceRequestStatus.open,
            description: "other description"
        }};

        const response = await handler(Object.assign({}, testEvent, {
            body: JSON.stringify(changeSr)
        }));

        expect(response.statusCode).toBe(200);
    });

}));
