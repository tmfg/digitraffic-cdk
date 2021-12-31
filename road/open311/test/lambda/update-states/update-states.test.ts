import {handler} from '../../../lib/lambda/update-states/lambda-update-states';
import {dbTestBase} from "../../db-testutil";
import {TestHttpServer} from "digitraffic-common/test/httpserver";
import * as StatesDb from "../../../lib/db/states";
import {Locale} from "../../../lib/model/locale";
import {DTDatabase} from "digitraffic-common/postgres/database";

const SERVER_PORT = 8089;

process.env.ENDPOINT_USER = "some_user";
process.env.ENDPOINT_PASS = "some_pass";
process.env.ENDPOINT_URL = `http://localhost:${SERVER_PORT}`;

describe('update-states', dbTestBase((db: DTDatabase) => {

    test('update', async () => {
        const server = new TestHttpServer();
        server.listen(SERVER_PORT, {
            "/states": (url) => {
                const locale = ((url as string).match(/\/.+=(.+)/) as string[])[1];
                return fakeStates(locale);
            },
        });

        try {
            const expectedKey = 1;

            await handler();

            const foundSubjectsFi = await StatesDb.findAll(Locale.FINNISH, db);
            expect(foundSubjectsFi.length).toBe(1);
            expect(foundSubjectsFi[0].key).toBe(expectedKey);

            const foundSubjectsEn = await StatesDb.findAll(Locale.ENGLISH, db);
            expect(foundSubjectsEn.length).toBe(1);
            expect(foundSubjectsEn[0].key).toBe(expectedKey);
        } finally {
            server.close();
        }
    });

}));

function fakeStates(locale?: string) {
    if (locale == 'fi') {
        return `
<?xml version="1.0" encoding="UTF-8"?>
<states>
    <state>
        <key>1</key>
        <name>Odottaa käsittelyä</name>
        <locale>fi</locale>
    </state>
</states>
`;
    }
    return `
<?xml version="1.0" encoding="UTF-8"?>
<states>
    <state>
        <key>1</key>
        <name>Awaiting handling</name>
        <locale>en</locale>
    </state>
</states>
`;
}