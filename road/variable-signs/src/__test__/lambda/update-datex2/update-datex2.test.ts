process.env["SECRET_ID"] = "SECRET";

import { dbTestBase, setup } from "../../db-testutil.js";
import { readFileSync } from "node:fs";
import * as VariableSignsService from "../../../service/variable-signs.js";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import type { StatusCodeValue } from "../../../model/status-code-value.js";
import { jest } from "@jest/globals";

describe(
    "lambda-update-datex2",
    dbTestBase((db) => {
        jest.spyOn(ProxyHolder.prototype, "setCredentials").mockResolvedValue();

        test("update_valid_datex2", async () => {
            await updateFile("valid_datex2.xml", 200);
            await setup(db);

            const [datex2, lastModified] = await VariableSignsService.findActiveSignsDatex2();

            expect(datex2).toMatch(/xml/);
            expect(datex2).toMatch(/KRM015651/);
            expect(datex2).toMatch(/KRM015511/);
            console.log(lastModified);
        });

        test("update_valid_datex2_without_body", async () => {
            await updateFile("invalid_datex2_without_body.xml", 400);
        });

        test("update_valid_datex2_without_publication", async () => {
            await updateFile("invalid_datex2_without_publication.xml", 400);
        });

        test("insert_update", async () => {
            await updateFile("valid_datex2.xml", 200);
            await setup(db);

            const [oldDatex2, lastModified1] = await VariableSignsService.findActiveSignsDatex2();
            expect(oldDatex2).toMatch(/<overallStartTime>2020-02-19T14:45:02.013Z<\/overallStartTime>/);
            console.log(lastModified1.toISOString());

            // and then update
            await updateFile("valid_datex2_updated.xml", 200);

            const [newDatex2, lastModified2] = await VariableSignsService.findActiveSignsDatex2();
            expect(newDatex2).toMatch(/<overallStartTime>2020-02-20T14:45:02.013Z<\/overallStartTime>/);
            console.log(lastModified2.toISOString());
        });
    })
);

async function updateFile(filename: string, expectedStatusCode: number): Promise<StatusCodeValue> {
    const { handler } = await import ("../../../lambda/update-datex2/update-datex2.js");

    const request = getRequest(filename);
    const response = await handler(request);

    expect(response.statusCode).toBe(expectedStatusCode);

    return response;
}

function getRequest(filename: string): { body: string } {
    return {
        body: readFileSync("src/__test__/lambda/update-datex2/" + filename, "utf8")
    };
}
