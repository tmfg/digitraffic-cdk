import * as pgPromise from "pg-promise";
import {findAll, update} from "../../../lib/db/db-subjects";
import {newSubject} from "../testdata";
import {dbTestBase} from "../db-testutil";
import {shuffle} from "../../../../../common/js/js-utils";
import {SubjectLocale} from "../../../lib/model/subject";

describe('db-subjects', dbTestBase((db: pgPromise.IDatabase<any,any>) => {

    test('findAll', async () => {
        const locale = shuffle([SubjectLocale.ENGLISH, SubjectLocale.FINNISH, SubjectLocale.SWEDISH])[0];
        const subjects = Array.from({length: Math.floor(Math.random() * 10)}).map(() => {
            return newSubject(locale);
        });
        await update(subjects, db);

        const foundSubjects = await findAll(locale, db);

        expect(foundSubjects.length).toBe(subjects.length);
    });

    test('update - old subjects are cleared', async () => {
        const locale = shuffle([SubjectLocale.ENGLISH, SubjectLocale.FINNISH, SubjectLocale.SWEDISH])[0];
        const previousSubject = newSubject(locale);
        await update([previousSubject], db);

        const theNewSubject = newSubject(locale);
        await update([theNewSubject], db);

        const foundSubjects = await findAll(locale, db);

        expect(foundSubjects.length).toBe(1);
        expect(foundSubjects[0]).toMatchObject(theNewSubject);
    });

}));
