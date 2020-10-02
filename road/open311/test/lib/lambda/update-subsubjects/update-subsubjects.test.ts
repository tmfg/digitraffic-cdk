import * as pgPromise from "pg-promise";
import {handler} from '../../../../lib/lambda/update-subsubjects/lambda-update-subsubjects';
import {dbTestBase} from "../../db-testutil";
import {TestHttpServer} from "../../../../../../common/test/httpserver";
import {findAll} from "../../../../lib/db/db-subsubjects";
import {SubjectLocale} from "../../../../lib/model/subject";

const SERVER_PORT = 8091;

process.env.ENDPOINT_USER = "some_user";
process.env.ENDPOINT_PASS = "some_pass";
process.env.ENDPOINT_URL = `http://localhost:${SERVER_PORT}`;

describe('update-subsubjects', dbTestBase((db: pgPromise.IDatabase<any, any>) => {

    test('update', async () => {
        const server = new TestHttpServer();
        server.listen(SERVER_PORT, {
            "/subsubjects": (url) => {
                // @ts-ignore
                const locale = url.match(/\/.+=(.+)/)[1];
                return fakeSubSubjects(locale);
            }
        });

        try {
            const expectedIds = [305];
            await handler();
            const foundSubSubjects = await findAll(db);
            expect(foundSubSubjects.length).toBe(3);
            expect(foundSubSubjects.filter(s => s.locale == SubjectLocale.FINNISH).map(s => s.id)).toMatchObject(expectedIds);
            expect(foundSubSubjects.filter(s => s.locale == SubjectLocale.SWEDISH).map(s => s.id)).toMatchObject(expectedIds);
            expect(foundSubSubjects.filter(s => s.locale == SubjectLocale.ENGLISH).map(s => s.id)).toMatchObject(expectedIds);
        } finally {
            server.close();
        }
    });

}));

function fakeSubSubjects(locale?: string) {
    if (locale == 'fi') {
        return `
<?xml version="1.0" encoding="UTF-8"?>
<subsubjects>
    <subsubject>
        <active>1</active>
        <name>Vettä tai öljyä tiellä</name>
        <id>305</id>
        <locale>fi</locale>
        <subject_id>3</subject_id>
    </subsubject>
</subsubjects>
`;
    } else if (locale == 'sv') {
        return `
<?xml version="1.0" encoding="UTF-8"?>
<subsubjects>
    <subsubject>
        <active>1</active>
        <name>Vatten eller olja på vägen</name>
        <id>305</id>
        <locale>sv</locale>
        <subject_id>3</subject_id>
    </subsubject>
</subsubjects>
`;
    }
    return `
<?xml version="1.0" encoding="UTF-8"?>
<subsubjects>
    <subsubject>
        <active>1</active>
        <name>Water or oil on the road</name>
        <id>305</id>
        <locale>en</locale>
        <subject_id>3</subject_id>
    </subsubject>
</subsubjects>
`;
}