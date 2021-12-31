import * as StatesDb from "../../lib/db/states";
import {newState} from "../testdata";
import {dbTestBase} from "../db-testutil";
import {Locale} from "../../lib/model/locale";

describe('db-states', dbTestBase((db) => {

    test('findAll', async () => {
        const locale = Locale.ENGLISH;
        const states = Array.from({length: Math.floor(Math.random() * 10)}).map(() => {
            return newState(locale);
        });
        await StatesDb.update(states, db);

        const foundStates = await StatesDb.findAll(locale, db);

        expect(foundStates.length).toBe(states.length);
    });

    test('update - old states are cleared', async () => {
        const locale = Locale.ENGLISH;
        const previousState = newState(locale);
        await StatesDb.update([previousState], db);

        const theNewState = newState(locale);
        await StatesDb.update([theNewState], db);

        const foundStates = await StatesDb.findAll(locale, db);

        expect(foundStates.length).toBe(1);
        expect(foundStates[0]).toMatchObject(theNewState);
    });

}));
