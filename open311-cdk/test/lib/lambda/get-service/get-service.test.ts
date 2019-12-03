import * as pgPromise from "pg-promise";
import {handler} from "../../../../lib/lambda/get-service/lambda-get-service";
import {newService} from "../../testdata";
import {insert} from "../../../../lib/db/db-services";
import {dbTestBase} from "../../db-testutil";
const testEvent = require('../../test-event');

describe('lambda-get-service', dbTestBase((db: pgPromise.IDatabase<any,any>) => {

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

}));
