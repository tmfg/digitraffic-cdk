import * as pgPromise from "pg-promise";
import {handler} from "../../../../lib/lambda/update-annotations/lambda-update-annotations";
import {dbTestBase, insertServiceRequest} from "../../db-testutil";

describe('update-annotations', dbTestBase((db: pgPromise.IDatabase<any,any>) => {

    test('Multiple service requests - created', async () => {
        const response = await handler();

        expect(response.statusCode).toBe(200);
    });

}));
