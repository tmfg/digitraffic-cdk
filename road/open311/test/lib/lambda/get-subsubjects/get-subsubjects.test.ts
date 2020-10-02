import * as pgPromise from "pg-promise";
import {handler} from "../../../../lib/lambda/get-subsubjects/lambda-get-subsubjects";
import {update} from "../../../../lib/db/db-subsubjects";
import {newSubSubject} from "../../testdata";
import {dbTestBase} from "../../db-testutil";

describe('lambda-get-subsubjects', dbTestBase((db: pgPromise.IDatabase<any,any>) => {

    test('no subsubjects', async () => {
        const response = await handler();

        expect(response).toMatchObject([]);
    });

    test('some subsubjects', async () => {
        const subSubjects =
            Array.from({length: Math.floor(Math.random() * 10)}).map(() => newSubSubject());
        await update(subSubjects, db);

        const response = await handler();

        expect(response.length).toBe(subSubjects.length);
    });

}));
