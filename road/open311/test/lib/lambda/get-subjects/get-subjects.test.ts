import * as pgPromise from "pg-promise";
import {handler} from "../../../../lib/lambda/get-subjects/lambda-get-subjects";
import {update} from "../../../../lib/db/db-subjects";
import {newSubject} from "../../testdata";
import {dbTestBase} from "../../db-testutil";
import {SubjectLocale} from "../../../../lib/model/subject";
import {shuffle} from "../../../../../../common/js/js-utils";

describe('lambda-get-subjects', dbTestBase((db: pgPromise.IDatabase<any,any>) => {

    test('no subjects', async () => {
        const response = await handler({locale: SubjectLocale.ENGLISH});

        expect(response).toMatchObject([]);
    });

    test('default locale', async () => {
        await update([newSubject(SubjectLocale.ENGLISH)], db);

        const response = await handler({});

        expect(response.length).toBe(1);
    });

    test('some subjects', async () => {
        const locale = shuffle([SubjectLocale.ENGLISH, SubjectLocale.FINNISH, SubjectLocale.SWEDISH])[0];
        const subjects =
            Array.from({length: Math.floor(Math.random() * 10)}).map(() => newSubject(locale));
        await update(subjects, db);

        const response = await handler({locale: locale});

        expect(response.length).toBe(subjects.length);
    });

}));
