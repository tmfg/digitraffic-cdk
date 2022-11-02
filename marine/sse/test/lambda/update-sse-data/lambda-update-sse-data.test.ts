process.env.SECRET_ID = "Testi";

import { RdsHolder } from "@digitraffic/common/dist/aws/runtime/secrets/rds-holder";
import * as sinon from "sinon";
import * as LambdaUpdateSseData from "../../../lib/lambda/update-sse-data/lambda-update-sse-data";
import * as SseUpdateService from "../../../lib/service/sse-update-service";
import * as DbTestutil from "../../db-testutil";
import { readFileSync } from "fs";
import { TheSSEReportRootSchema } from "../../../lib/generated/tlsc-sse-reports-schema";

describe(
    "update-sse-data-test",
    DbTestutil.dbTestBase(() => {
        const sandbox = sinon.createSandbox();
        afterEach(() => sandbox.restore());

        test("handle data post", async () => {
            const json = readFileSync(
                "test/data/example-sse-report.json",
                "utf8"
            );
            const data = JSON.parse(json) as unknown as TheSSEReportRootSchema;
            const saveDataStub = sandbox
                .stub(SseUpdateService, "saveSseData")
                .returns(Promise.resolve({ saved: 3, errors: 0 }));

            const retVal = { saved: 3, errors: 0 };

            sinon
                .stub(RdsHolder.prototype, "setCredentials")
                .returns(Promise.resolve());

            await expect(
                LambdaUpdateSseData.handler(data)
            ).resolves.toStrictEqual(retVal);

            expect(saveDataStub.calledWith(data.SSE_Reports)).toBe(true);
        });
    })
);
