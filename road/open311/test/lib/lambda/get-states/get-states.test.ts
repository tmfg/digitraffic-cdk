import * as pgPromise from "pg-promise";
import {handler} from "../../../../lib/lambda/get-states/lambda-get-states";
import {update} from "../../../../lib/db/db-states";
import {newState} from "../../testdata";
import {dbTestBase} from "../../db-testutil";

describe('lambda-get-states', dbTestBase((db: pgPromise.IDatabase<any,any>) => {

    test('no states', async () => {
        const response = await handler();

        expect(response).toMatchObject([]);
    });

    test('some states', async () => {
        const states =
            Array.from({length: Math.floor(Math.random() * 10)}).map(() => newState());
        await update(states, db);

        const response = await handler();

        expect(response.length).toBe(states.length);
    });

}));
