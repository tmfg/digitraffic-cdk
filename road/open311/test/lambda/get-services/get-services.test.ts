import * as pgPromise from "pg-promise";
import {handler} from "../../../lib/lambda/get-services/lambda-get-services";
import * as ServicesDb from "../../../lib/db/services";
import {newService} from "../../testdata";
import {dbTestBase} from "../../db-testutil";

describe('lambda-get-services', dbTestBase((db: pgPromise.IDatabase<any,any>) => {

    test('no services', async () => {
        const response = await handler();

        expect(response).toMatchObject([]);
    });

    test('some service services', async () => {
        const services =
            Array.from({length: Math.floor(Math.random() * 10)}).map(() => newService());
        await ServicesDb.update(services, db);

        const response = await handler();

        expect(response.length).toBe(services.length);
    });

}));