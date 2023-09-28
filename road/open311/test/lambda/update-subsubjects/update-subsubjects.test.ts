import { handler } from "../../../lib/lambda/update-subsubjects/lambda-update-subsubjects";
import { dbTestBase } from "../../db-testutil";
import { TestHttpServer } from "@digitraffic/common/dist/test/httpserver";
import * as SubSubjectsDb from "../../../lib/db/subsubjects";
import { Locale } from "../../../lib/model/locale";
import { DTDatabase } from "@digitraffic/common/dist/database/database";

const SERVER_PORT = 8091;

process.env.ENDPOINT_USER = "some_user";
process.env.ENDPOINT_PASS = "some_pass";
process.env.ENDPOINT_URL = `http://localhost:${SERVER_PORT}`;

describe(
    "update-subsubjects",
    dbTestBase((db: DTDatabase) => {
        test("update", async () => {
            const server = new TestHttpServer();
            server.listen(SERVER_PORT, {
                "/subsubjects": (url) => {
                    const locale = ((url as string).match(/\/.+=(.+)/) as string[])[1];
                    return fakeSubSubjects(locale);
                }
            });

            try {
                const expectedId = 305;
                await handler();

                const foundSubSubjectsFi = await SubSubjectsDb.findAll(Locale.FINNISH, db);
                expect(foundSubSubjectsFi.length).toBe(1);
                expect(foundSubSubjectsFi[0].id).toBe(expectedId);

                const foundSubSubjectsSv = await SubSubjectsDb.findAll(Locale.SWEDISH, db);
                expect(foundSubSubjectsSv.length).toBe(1);
                expect(foundSubSubjectsSv[0].id).toBe(expectedId);

                const foundSubSubjectsEn = await SubSubjectsDb.findAll(Locale.ENGLISH, db);
                expect(foundSubSubjectsEn.length).toBe(1);
                expect(foundSubSubjectsEn[0].id).toBe(expectedId);
            } finally {
                server.close();
            }
        });
    })
);

function fakeSubSubjects(locale?: string): string {
    if (locale === "fi") {
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
    } else if (locale === "sv") {
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
