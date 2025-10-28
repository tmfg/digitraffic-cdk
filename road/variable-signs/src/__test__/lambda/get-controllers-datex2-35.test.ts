import { type DTDatabase } from "@digitraffic/common/dist/database/database";
import { dbTestBase, mockProxyHolder } from "../db-testutil.js";
import { ExpectResponse } from "@digitraffic-cdk/testing";
import { type LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";

async function getResponseFromLambda(): Promise<LambdaResponse> {
  const { handler } = await import(
    "../../lambda/get-controllers-datex2-35/get-controllers-datex2-35.js"
  );

  return await handler();
}

describe(
  "get-controllers-datex2-35-lambda-test",
  dbTestBase((_db: DTDatabase) => {
    mockProxyHolder();

    test("empty", async () => {
      const response = await getResponseFromLambda();

      ExpectResponse.ok(response);
    });
  }),
);
