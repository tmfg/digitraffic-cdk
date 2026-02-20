import type { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { ExpectResponse } from "@digitraffic-cdk/testing";
import { dbTestBase, mockProxyHolder } from "../db-testutil.js";

async function getResponseFromLambda(): Promise<LambdaResponse> {
  const { handler } = await import("../../lambda/get-datex2/get-datex2.js");

  return await handler();
}

describe(
  "get-datex2-lambda-test",
  dbTestBase((_db: DTDatabase) => {
    mockProxyHolder();

    test("empty", async () => {
      const response = await getResponseFromLambda();

      ExpectResponse.ok(response);
    });
  }),
);
