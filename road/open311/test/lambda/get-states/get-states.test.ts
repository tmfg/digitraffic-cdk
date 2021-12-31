import {handler} from "../../../lib/lambda/get-states/lambda-get-states";
import * as StatesDb from "../../../lib/db/states";
import {newState} from "../../testdata";
import {dbTestBase} from "../../db-testutil";
import {Locale} from "../../../lib/model/locale";
import {shuffle} from "digitraffic-common/js/js-utils";

describe('lambda-get-states', dbTestBase((db) => {

    test('no states', async () => {
        const response = await handler({locale: Locale.ENGLISH});

        expect(response).toMatchObject([]);
    });

    test('default locale', async () => {
        await StatesDb.update([newState(Locale.ENGLISH)], db);

        const response = await handler({});

        expect(response.length).toBe(1);
    });

    test('some states', async () => {
        const locale = shuffle([Locale.ENGLISH, Locale.FINNISH])[0];
        const subjects =
            Array.from({length: Math.floor(Math.random() * 10)}).map(() => newState(locale));
        await StatesDb.update(subjects, db);

        const response = await handler({locale: locale});

        expect(response.length).toBe(subjects.length);
    });

}));
