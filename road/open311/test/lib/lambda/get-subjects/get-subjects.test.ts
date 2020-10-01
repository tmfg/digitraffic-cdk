import * as pgPromise from "pg-promise";
import {handler} from "../../../../lib/lambda/get-subjects/lambda-get-subjects";
import {update} from "../../../../lib/db/db-subjects";
import {newSubject} from "../../testdata";
import {dbTestBase} from "../../db-testutil";

describe('lambda-get-subjects', dbTestBase((db: pgPromise.IDatabase<any,any>) => {

    test('no subjects', async () => {
        const response = await handler();

        expect(response).toMatchObject([]);
    });

    test('some subjects', async () => {
        const subjects =
            Array.from({length: Math.floor(Math.random() * 10)}).map(() => newSubject());
        await update(subjects, db);

        const response = await handler();

        expect(response.length).toBe(subjects.length);
    });

}));
