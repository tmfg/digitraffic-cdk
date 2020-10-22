import * as pgPromise from "pg-promise";
import {findAll, update} from "../../../lib/db/db-states";
import {newState} from "../testdata";
import {dbTestBase} from "../db-testutil";
import {Locale} from "../../../lib/model/locale";

describe('db-states', dbTestBase((db: pgPromise.IDatabase<any,any>) => {

    test('findAll', async () => {
        const locale = Locale.ENGLISH;
        const states = Array.from({length: Math.floor(Math.random() * 10)}).map(() => {
            return newState(locale);
        });
        await update(states, db);

        const foundStates = await findAll(locale, db);

        expect(foundStates.length).toBe(states.length);
    });

    test('update - old states are cleared', async () => {
        const locale = Locale.ENGLISH;
        const previousState = newState(locale);
        await update([previousState], db);

        const theNewState = newState(locale);
        await update([theNewState], db);

        const foundStates = await findAll(locale, db);

        expect(foundStates.length).toBe(1);
        expect(foundStates[0]).toMatchObject(theNewState);
    });

}));
