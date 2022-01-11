import {handler} from "../../../lib/lambda/get-subsubjects/lambda-get-subsubjects";
import * as SubSubjectsDb from "../../../lib/db/subsubjects";
import {newSubSubject} from "../../testdata";
import {dbTestBase} from "../../db-testutil";
import {Locale} from "../../../lib/model/locale";
import {shuffle} from "digitraffic-common/utils/base64";

describe('lambda-get-subsubjects', dbTestBase((db) => {

    test('no subsubjects', async () => {
        const response = await handler({locale: Locale.ENGLISH});

        expect(response).toMatchObject([]);
    });

    test('default locale', async () => {
        await SubSubjectsDb.update([newSubSubject(Locale.ENGLISH)], db);

        const response = await handler({});

        expect(response.length).toBe(1);
    });

    test('response format', async () => {
        const locale = shuffle([Locale.ENGLISH, Locale.FINNISH, Locale.SWEDISH])[0];
        const subSubject = newSubSubject(locale);
        await SubSubjectsDb.update([subSubject], db);

        const response = await handler({locale: locale});

        expect(response[0]).toMatchObject({
            active: subSubject.active,
            name: subSubject.name,
            id: subSubject.id,
            locale: subSubject.locale,
            subjectId: subSubject.subject_id,
        });
    });

}));
