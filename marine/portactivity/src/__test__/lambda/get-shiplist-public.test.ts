import type { APIGatewayProxyEventSubset } from "@digitraffic/common/dist/aws/types/lambda-proxy-types";
import { jest } from "@jest/globals";
import type { APIGatewayProxyResult } from "aws-lambda";
import type { ShiplistSecret } from "../../lambda/get-shiplist-public/get-shiplist-public.js";
import { handler } from "../../lambda/get-shiplist-public/get-shiplist-public.js";
import { dbTestBase, mockSecrets } from "../db-testutil.js";

const AUTH = "test";

const secret: ShiplistSecret = {
  auth: AUTH,
};

describe(
  "get-shiplist-public",
  dbTestBase(() => {
    beforeEach(() => {
      jest.restoreAllMocks();
      mockSecrets(secret);
    });

    async function getResponse(
      request: unknown,
    ): Promise<APIGatewayProxyResult> {
      return await handler(request as APIGatewayProxyEventSubset);
    }

    test("no auth - 401", async () => {
      const response = await getResponse({ queryStringParameters: {} });

      expect(response.statusCode).toBe(401);
    });

    test("invalid auth - 403", async () => {
      const response = await getResponse({
        queryStringParameters: { auth: `${AUTH}foo` },
      });

      expect(response.statusCode).toBe(403);
    });

    test("no locode - 400", async () => {
      const response = await getResponse({
        queryStringParameters: { auth: AUTH },
      });

      expect(response.statusCode).toBe(400);
    });

    test("invalid locode - 400", async () => {
      const response = await getResponse({
        queryStringParameters: { auth: AUTH, locode: "FOO" },
      });

      expect(response.statusCode).toBe(400);
    });
  }),
);
