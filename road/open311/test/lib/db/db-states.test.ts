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

    test('update - deletes previous', async () => {
        const previousState = newState();
        await update([previousState], db);

        const theNewState = newState();
        await update([theNewState], db);

        const foundStates = await findAll(db);

        expect(foundStates.length).toBe(1);
        expect(foundStates[0]).toMatchObject(theNewState);
    });

}));
