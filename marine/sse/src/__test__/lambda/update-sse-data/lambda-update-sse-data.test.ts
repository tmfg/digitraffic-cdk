// eslint-disable-next-line @typescript-eslint/no-use-before-define
const mockFn = jest.fn(() => {
  return Promise.resolve({ saved: 3, errors: 0 })
})

// eslint-disable-next-line @typescript-eslint/no-use-before-define
jest.unstable_mockModule("../../../service/sse-update-service.js", () => {
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  return {
    //...actual,
    __esModule: true,
    saveSseData: mockFn
  }
})

import { readFileSync } from "node:fs";
import type { TheSSEReportRootSchema } from "../../../generated/tlsc-sse-reports-schema.d.ts";
import { jest } from "@jest/globals";

process.env['SECRET_ID'] = "Testi";

const DbTestutil = await import("../../db-testutil.js")
const { saveSseData } = await import("../../../service/sse-update-service.js")
const LambdaUpdateSseData = await import("../../../lambda/update-sse-data/lambda-update-sse-data.js")
const rdsHolder = await import("@digitraffic/common/dist/aws/runtime/secrets/rds-holder");
const { RdsHolder } = rdsHolder;
describe(
    "update-sse-data-test",
    DbTestutil.dbTestBase(() => {

      afterEach(() => {
        jest.restoreAllMocks();
      });

      beforeEach(() => {
        process.env['SECRET_ID'] = "Testi";
      });

        test("handle data post", async () => {

            const json = readFileSync("src/__test__/data/example-sse-report.json", "utf8");
            const data = JSON.parse(json) as unknown as TheSSEReportRootSchema;

            const retVal = { saved: 3, errors: 0 };

            jest.spyOn(RdsHolder.prototype, "setCredentials").mockImplementationOnce(()=>Promise.resolve());

            await expect(LambdaUpdateSseData.handler(data)).resolves.toStrictEqual(retVal);

            expect(saveSseData).toHaveBeenCalledWith(data.SSE_Reports);
        });
    })
);
