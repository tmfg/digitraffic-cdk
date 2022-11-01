import * as sinon from "sinon";
import { dbTestBase, mockSecrets } from "../db-testutil";
import {
    handler,
    ShiplistSecret,
} from "../../lib/lambda/get-shiplist-public/get-shiplist-public";
import {
    ProxyLambdaRequest,
    ProxyLambdaResponse,
} from "@digitraffic/common/dist/aws/types/proxytypes";

const AUTH = "test";

const secret: ShiplistSecret = {
    auth: AUTH,
};

describe(
    "get-shiplist-public",
    dbTestBase(() => {
        beforeEach(() => {
            sinon.restore();
            mockSecrets(secret);
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async function getResponse(request: any): Promise<ProxyLambdaResponse> {
            return await handler(request as ProxyLambdaRequest);
        }

        test("no auth - 401", async () => {
            const response = await getResponse({ queryStringParameters: {} });

            expect(response.statusCode).toBe(401);
        });

        test("invalid auth - 403", async () => {
            const response = await getResponse({
                queryStringParameters: { auth: AUTH + "foo" },
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
    })
);
