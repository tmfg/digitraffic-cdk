import * as pgPromise from "pg-promise";
import {handler} from "../../../../lib/lambda/get-requests/lambda-get-requests";
import {insert} from "../../../../lib/db/db-requests";
import {newServiceRequest} from "../../testdata";
import {dbTestBase} from "../../db-testutil";
const testEvent = require('../../test-event');

var db: pgPromise.IDatabase<any, any>;

describe('lambda-get-requests', dbTestBase((db: pgPromise.IDatabase<any,any>) => {

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
            Array.from({length: Math.floor(Math.random() * 10)}).map(() => newServiceRequest());
        await insert(db, serviceRequests);

        const response = await handler(testEvent);

        expect(JSON.parse(response.body).length).toBe(serviceRequests.length);
    });

}));