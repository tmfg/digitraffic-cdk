import * as pgPromise from "pg-promise";
import {findAll, update} from "../../../lib/db/db-subsubjects";
import {newSubSubject} from "../testdata";
import {dbTestBase} from "../db-testutil";
import {shuffle} from "../../../../../common/js/js-utils";
import {Locale} from "../../../lib/model/locale";

describe('db-subsubjects', dbTestBase((db: pgPromise.IDatabase<any,any>) => {

    test('findAll', async () => {
        const locale = shuffle([Locale.ENGLISH, Locale.FINNISH, Locale.SWEDISH])[0];
        const subSubjects = Array.from({length: Math.floor(Math.random() * 10)}).map(() => {
            return newSubSubject(locale);
        });
        await update(subSubjects, db);

        const foundSubSubjects = await findAll(locale, db);

        expect(foundSubSubjects.length).toBe(subSubjects.length);
    });

    test('update - old subsubjects are cleared', async () => {
        const locale = shuffle([Locale.ENGLISH, Locale.FINNISH, Locale.SWEDISH])[0];
        const previousSubSubject = newSubSubject(locale);
        await update([previousSubSubject], db);

        const theNewSubSubject = newSubSubject(locale);
        await update([theNewSubSubject], db);

        const foundSubSubjects = await findAll(locale, db);

        expect(foundSubSubjects.length).toBe(1);
        expect(foundSubSubjects[0]).toMatchObject(theNewSubSubject);
    });

}));
