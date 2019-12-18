import * as pgPromise from "pg-promise";
import {handler} from "../../../../lib/lambda/get-services/lambda-get-services";
import {update} from "../../../../lib/db/db-services";
import {newService} from "../../testdata";
import {dbTestBase} from "../../db-testutil";
const testEvent = require('../../test-event');

var db: pgPromise.IDatabase<any, any>;

describe('lambda-get-services', dbTestBase((db: pgPromise.IDatabase<any,any>) => {

    test('status is ok', async () => {
        const response = await handler(testEvent);

        expect(response.statusCode).toBe(200);
    });

    test('no services', async () => {
        const response = await handler(testEvent);

        expect(JSON.parse(response.body)).toMatchObject([]);
    });

    test('some service services', async () => {
        const services =
            Array.from({length: Math.floor(Math.random() * 10)}).map(() => newService());
        await update(db, services);

        const response = await handler(testEvent);

        expect(JSON.parse(response.body).length).toBe(services.length);
    });

}));