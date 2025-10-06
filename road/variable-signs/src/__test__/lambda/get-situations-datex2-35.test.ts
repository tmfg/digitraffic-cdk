import { type DTDatabase } from "@digitraffic/common/dist/database/database";
import { dbTestBase } from "../db-testutil.js";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { jest } from "@jest/globals";
import { ExpectResponse } from "@digitraffic-cdk/testing";
import { type LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";

async function getResponseFromLambda(): Promise<LambdaResponse> {
  const { handler } = await import(
    "../../lambda/get-situations-datex2-35/get-situations-datex2-35.js"
  );

  return await handler();
}

describe(
  "get-controllers-datex2-35-lambda-test",
  dbTestBase((_db: DTDatabase) => {
    jest.spyOn(ProxyHolder.prototype, "setCredentials").mockResolvedValue();

    test("empty", async () => {
      const response = await getResponseFromLambda();

      ExpectResponse.ok(response);
    });
  }),
);
