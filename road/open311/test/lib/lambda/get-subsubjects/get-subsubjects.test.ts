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

    test('default locale', async () => {
        await update([newSubSubject(SubjectLocale.ENGLISH)], db);

        const response = await handler({});

        expect(response.length).toBe(1);
    });

    test('response format', async () => {
        const locale = shuffle([SubjectLocale.ENGLISH, SubjectLocale.FINNISH, SubjectLocale.SWEDISH])[0];
        const subSubject = newSubSubject(locale);
        await update([subSubject], db);

        const response = await handler({locale: locale});

        expect(response[0]).toMatchObject({
            active: subSubject.active,
            name: subSubject.name,
            id: subSubject.id,
            locale: subSubject.locale,
            subjectId: subSubject.subject_id
        });
    });

}));
