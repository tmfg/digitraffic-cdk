import * as pgPromise from "pg-promise";
import {handler} from "../../../../lib/lambda/get-subsubjects/lambda-get-subsubjects";
import {update} from "../../../../lib/db/db-subsubjects";
import {newSubSubject} from "../../testdata";
import {dbTestBase} from "../../db-testutil";
import {SubjectLocale} from "../../../../lib/model/subject";
import {shuffle} from "../../../../../../common/js/js-utils";

describe('lambda-get-subsubjects', dbTestBase((db: pgPromise.IDatabase<any,any>) => {

    test('no subsubjects', async () => {
        const response = await handler({locale: SubjectLocale.ENGLISH});

        expect(response).toMatchObject([]);
    });

    test('some subsubjects', async () => {
        const locale = shuffle([SubjectLocale.ENGLISH, SubjectLocale.FINNISH, SubjectLocale.SWEDISH])[0];
        const subSubjects =
            Array.from({length: Math.floor(Math.random() * 10)}).map(() => newSubSubject(locale));
        await update(subSubjects, db);

        const response = await handler({locale: locale});

        expect(response.length).toBe(subSubjects.length);
    });

}));
