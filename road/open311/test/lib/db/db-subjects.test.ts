import * as pgPromise from "pg-promise";
import {findAll, update} from "../../../lib/db/db-subjects";
import {newSubject} from "../testdata";
import {dbTestBase} from "../db-testutil";

describe('db-subjects', dbTestBase((db: pgPromise.IDatabase<any,any>) => {

    test('findAll', async () => {
        const subjects = Array.from({length: Math.floor(Math.random() * 10)}).map(() => {
            return newSubject();
        });
        await update(subjects, db);

        const foundSubjects = await findAll(db);

        expect(foundSubjects.length).toBe(subjects.length);
    });

    test('update - old subjects are cleared', async () => {
        const previousSubject = newSubject();
        await update([previousSubject], db);

        const theNewSubject = newSubject();
        await update([theNewSubject], db);

        const foundSubjects = await findAll(db);

        expect(foundSubjects.length).toBe(1);
        expect(foundSubjects[0]).toMatchObject(theNewSubject);
    });

}));
