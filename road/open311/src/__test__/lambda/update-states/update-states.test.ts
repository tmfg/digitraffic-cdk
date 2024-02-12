import { dbTestBase } from "../../db-testutil.js";
import * as StatesDb from "../../../db/states.js";
import { Locale } from "../../../model/locale.js";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { jest } from "@jest/globals";
import axios, { type AxiosRequestConfig } from "axios";

const SERVER_PORT = 8089;

// eslint-disable-next-line dot-notation
process.env["ENDPOINT_USER"] = "some_user";
// eslint-disable-next-line dot-notation
process.env["ENDPOINT_PASS"] = "some_pass";
// eslint-disable-next-line dot-notation
process.env["ENDPOINT_URL"] = `http://localhost:${SERVER_PORT}`;

const lambda = await import("../../../lambda/update-states/lambda-update-states.js");

describe(
    "update-states",
    dbTestBase((db: DTDatabase) => {
        test("update", async () => {
            jest.spyOn(axios, "get").mockImplementation(
                (_url: string, _config?: AxiosRequestConfig<unknown>): Promise<unknown> => {
                    if (_url.match("/states")) {
                        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
                        const locale = _url!.match(/\/.+=(.+)/)![1];
                        return Promise.resolve({
                            status: 200,
                            data: fakeStates(locale)
                        });
                    }
                    return Promise.resolve({
                        status: 404
                    });
                }
            );

            const expectedKey = 1;

            await lambda.handler();

            const foundSubjectsFi = await StatesDb.findAll(Locale.FINNISH, db);
            expect(foundSubjectsFi.length).toBe(1);
            expect(foundSubjectsFi[0]!.key).toBe(expectedKey);

            const foundSubjectsEn = await StatesDb.findAll(Locale.ENGLISH, db);
            expect(foundSubjectsEn.length).toBe(1);
            expect(foundSubjectsEn[0]!.key).toBe(expectedKey);
        });
    })
);

function fakeStates(locale?: string): string {
    if (locale === "fi") {
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
