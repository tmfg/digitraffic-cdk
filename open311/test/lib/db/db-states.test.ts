import * as pgPromise from "pg-promise";
import {findAll, update} from "../../../lib/db/db-states";
import {newState} from "../testdata";
import {dbTestBase} from "../db-testutil";

describe('db-states', dbTestBase((db: pgPromise.IDatabase<any,any>) => {

    test('findAll', async () => {
        const states = Array.from({length: Math.floor(Math.random() * 10)}).map(() => {
            return newState();
        });
        await update(states, db);

        const foundStates = await findAll(db);

        expect(foundStates.length).toBe(states.length);
    });

}));
