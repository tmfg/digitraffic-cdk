import { type DTDatabase } from "@digitraffic/common/dist/database/database";
import { assertDataCount, dbTestBase } from "../db-testutil.js";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { jest } from "@jest/globals";
import { type APIGatewayProxyResult } from "aws-lambda";
import { ERRORS } from "../../lambda/upload-datex2/upload-datex2.js";
import type { Datex2UpdateObject } from "../../model/datex2-update-object.js";

async function getResponseFromLambda(
  event: Record<string, string> = {},
): Promise<APIGatewayProxyResult> {
  const { handler } = await import(
    "../../lambda/upload-datex2/upload-datex2.js"
  );

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
  "upload-datex2-lambda-test",
  dbTestBase((db: DTDatabase) => {
    jest.spyOn(ProxyHolder.prototype, "setCredentials").mockResolvedValue();

    test("missing body", async () => {
      const response = await getResponseFromLambda({});

      expect(response.statusCode).toEqual(400);
      expect(response.body).toEqual(ERRORS.MISSING_BODY);

      await assertDataCount(db, 0);
    });

    test("empty payload", async () => {
      const response = await getResponseFromLambda({
        body: JSON.stringify([]),
      });

      expect(response.statusCode).toEqual(400);
      expect(response.body).toEqual(ERRORS.INVALID_PAYLOAD);

      await assertDataCount(db, 0);
    });

    test("invalid payload", async () => {
      const response = await getResponseFromLambda({ body: "invalid" });

      expect(response.statusCode).toEqual(400);
      expect(response.body).toEqual(ERRORS.INVALID_PAYLOAD);

      await assertDataCount(db, 0);
    });

    test("valid payload", async () => {
      const response = await getResponseFromLambda({
        body: JSON.stringify(validUpdateObject),
      });

      expect(response.statusCode).toEqual(200);

      await assertDataCount(db, 1);
    });
  }),
);
