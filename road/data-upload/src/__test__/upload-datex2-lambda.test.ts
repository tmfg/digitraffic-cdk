import { type DTDatabase } from "@digitraffic/common/dist/database/database";
import { assertDataCount, dbTestBase } from "./db-testutil.js";
import { type LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { ExpectResponse } from "@digitraffic-cdk/testing";
import { ERRORS } from "../lambda/upload-datex2/upload-datex2.js";
import { type Datex2UpdateObject } from "../model/datex2-update-object.js";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { jest } from "@jest/globals";

async function getResponseFromLambda(
  event: Record<string, string> = {},
): Promise<LambdaResponse> {
  const { handler } = await import("../lambda/upload-datex2/upload-datex2.js");

  return await handler(event);
}

const validUpdateObject: Datex2UpdateObject = {
  datexIIVersions: [{
    type: "variable-sign",
    version: "3.6",
    message: "<datex message>",
  }],
};

describe(
  "upload-datex2-test",
  dbTestBase((db: DTDatabase) => {
    jest.spyOn(ProxyHolder.prototype, "setCredentials").mockResolvedValue();

    test("missing body", async () => {
      const response = await getResponseFromLambda({});

      new ExpectResponse(response)
        .expectStatus(400)
        .expectBody(ERRORS.MISSING_BODY);

      await assertDataCount(db, 0);
    });

    test("empty payload", async () => {
      const response = await getResponseFromLambda({
        body: JSON.stringify([]),
      });

      new ExpectResponse(response)
        .expectStatus(400)
        .expectBody(ERRORS.INVALID_PAYLOAD);

      await assertDataCount(db, 0);
    });

    test("invalid payload", async () => {
      const response = await getResponseFromLambda({ body: "invalid" });

      new ExpectResponse(response)
        .expectStatus(400)
        .expectBody(ERRORS.INVALID_PAYLOAD);

      await assertDataCount(db, 0);
    });

    test("valid payload", async () => {
      const response = await getResponseFromLambda({
        body: JSON.stringify(validUpdateObject),
      });

      ExpectResponse.ok(response);

      await assertDataCount(db, 1);
    });
  }),
);
