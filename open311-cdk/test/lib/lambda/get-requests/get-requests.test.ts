import * as pgPromise from "pg-promise";
import {handler} from "../../../../lib/lambda/get-requests/lambda-get-requests";
import {newServiceRequest} from "../../testdata";
import {dbTestBase, insertServiceRequest} from "../../db-testutil";

describe('lambda-get-requests', dbTestBase((db: pgPromise.IDatabase<any,any>) => {

    test('no service requests', async () => {
        const response = await handler();

        expect(response).toMatchObject([]);
    });

    test('some service requests', async () => {
        const serviceRequests =
            Array.from({length: Math.floor(Math.random() * 10)}).map(() => newServiceRequest());
        await insertServiceRequest(db, serviceRequests);

        const response = await handler();

        expect(response.length).toBe(serviceRequests.length);
    });

}));