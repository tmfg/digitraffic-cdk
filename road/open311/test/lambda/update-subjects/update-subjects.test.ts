import {handler} from '../../../lib/lambda/update-subjects/lambda-update-subjects';
import {dbTestBase} from "../../db-testutil";
import {TestHttpServer} from "@digitraffic/common/test/httpserver";
import * as SubjectsDb from "../../../lib/db/subjects";
import {Locale} from "../../../lib/model/locale";

const SERVER_PORT = 8090;

process.env.ENDPOINT_USER = "some_user";
process.env.ENDPOINT_PASS = "some_pass";
process.env.ENDPOINT_URL = `http://localhost:${SERVER_PORT}`;

describe('update-subjects', dbTestBase((db) => {

    test('update', async () => {
        const server = new TestHttpServer();
        server.listen(SERVER_PORT, {
            "/subjects": (url) => {
                const locale = ((url as string).match(/\/.+=(.+)/) as string[])[1];
                return fakeSubjects(locale);
            },
        });

        try {
            const expectedId = 2;
            await handler();

            const foundSubjectsFi = await SubjectsDb.findAll(Locale.FINNISH, db);
            expect(foundSubjectsFi.length).toBe(1);
            expect(foundSubjectsFi[0].id).toBe(expectedId);

            const foundSubjectsSv = await SubjectsDb.findAll(Locale.SWEDISH, db);
            expect(foundSubjectsSv.length).toBe(1);
            expect(foundSubjectsSv[0].id).toBe(expectedId);

            const foundSubjectsEn = await SubjectsDb.findAll(Locale.ENGLISH, db);
            expect(foundSubjectsEn.length).toBe(1);
            expect(foundSubjectsEn[0].id).toBe(expectedId);
        } finally {
            server.close();
        }
    });

}));

function fakeSubjects(locale?: string) {
    if (locale == 'fi') {
        return `
<?xml version="1.0" encoding="UTF-8"?>
<subjects>
    <subject>
        <active>1</active>
        <name>Päällystetyn tien kunto (esim. päällystevaurio, harjaustarve)</name>
        <id>2</id>
        <locale>fi</locale>
    </subject>
</subjects>
`;
    } else if (locale == 'sv') {
        return `
<?xml version="1.0" encoding="UTF-8"?>
<subjects>
    <subject>
        <active>1</active>
        <name>En belagd vägs skick (t.ex. beläggningsskada, behov av borstning)</name>
        <id>2</id>
        <locale>sv</locale>
    </subject>
</subjects>
`;
    }
    return `
<?xml version="1.0" encoding="UTF-8"?>
<subjects>
    <subject>
        <active>1</active>
        <name>Condition of paved road (e.g. paving damage, need for brushing)</name>
        <id>2</id>
        <locale>en</locale>
    </subject>
</subjects>
`;
}