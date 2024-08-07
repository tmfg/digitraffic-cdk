import {
    CPO_NAME as DT_CPO_NAME,
    CPO_TOKEN_A,
    CPO_VERSIONS_ENPOINT,
    DT_CPO_ID,
    mockProxyAndSecretHolder,
    setTestEnv
} from "../../test-util.js";

import { dbTestBase, insertOcpiCpo } from "../../db-test-util.js";
import type {
    APIGatewayAuthorizerResult,
    APIGatewayEventRequestContextWithAuthorizer,
    Context
} from "aws-lambda";
import type {
    APIGatewayRequestAuthorizerEvent,
    APIGatewayRequestAuthorizerEventHeaders,
    AuthResponse
} from "aws-lambda";
import _ from "lodash";

import { afterEach, jest, test } from "@jest/globals";

setTestEnv();
const { handler } = await import("../../../lambda/authorizer/authorizer.js");

const OcpiRegistrationService = await import("../../../service/ocpi-registration-service.js");

//const sandbox = sinon.createSandbox();
const CPO_TOKEN_B = OcpiRegistrationService.generateToken();

interface Params {
    name: string;
    cpoToken: string | undefined;
    handlerCallbackCount: number;
    authorizerResultCpoId: string | undefined;
    effect: "Allow" | "Deny";
}

describe(
    "lambda-authorizer-test",
    dbTestBase((db) => {
        beforeEach(async () => {
            mockProxyAndSecretHolder();
            await insertOcpiCpo(
                db,
                DT_CPO_ID,
                DT_CPO_NAME,
                CPO_TOKEN_A,
                CPO_TOKEN_B,
                undefined,
                CPO_VERSIONS_ENPOINT
            );
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        test.each([
            [
                {
                    name: "authorize-success-valid-token",
                    cpoToken: CPO_TOKEN_B,
                    handlerCallbackCount: 1,
                    authorizerResultCpoId: DT_CPO_ID,
                    effect: "Allow"
                } satisfies Params
            ],
            [
                {
                    name: "authorize-fails-invalid-token",
                    cpoToken: OcpiRegistrationService.generateToken(), // This token in request is not found from db
                    handlerCallbackCount: 1,
                    authorizerResultCpoId: undefined,
                    effect: "Deny"
                } satisfies Params
            ],
            [
                {
                    name: "authorize-fails-missing-token",
                    cpoToken: undefined, // Token in request is missing
                    handlerCallbackCount: 1,
                    authorizerResultCpoId: undefined,
                    effect: "Deny"
                } satisfies Params
            ]
        ])("Test lambda authorizer: $name", async (testParams: Params) => {
            const authorizerEvent = createAPIGatewayRequestAuthorizerEvent(testParams.cpoToken);

            const callback = jest.fn(
                (error?: Error | string | null, result?: APIGatewayAuthorizerResult): void => {
                    console.log(
                        `callback called with (error: ${error?.toString()}, result: ${JSON.stringify(result)})`
                    );
                }
            );

            // Call authorizer lambda with apigw event that contains cpo token_b
            await handler(authorizerEvent, {} as Context, callback);

            expect(callback).toHaveBeenCalledTimes(testParams.handlerCallbackCount);
            expect(callback).toHaveBeenCalledWith(
                null,
                createAPIGatewayAuthorizerResponse(testParams.authorizerResultCpoId, testParams.effect)
            );
        });
    })
);

const METHOD_ARN = "arn:aws:execute-api:resource" as const;
function createAPIGatewayRequestAuthorizerEvent(
    cpoTokenB: string | undefined
): APIGatewayRequestAuthorizerEvent {
    const headers = cpoTokenB
        ? ({
              Authorization: `Token ${cpoTokenB}`
          } as APIGatewayRequestAuthorizerEventHeaders)
        : null;

    return {
        type: "REQUEST",
        methodArn: METHOD_ARN,
        resource: "string",
        path: "string",
        httpMethod: "string",
        headers,
        multiValueHeaders: null,
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as APIGatewayEventRequestContextWithAuthorizer<undefined>
    };
}

function createAPIGatewayAuthorizerResponse(
    cpoId: string | undefined,
    effect: "Allow" | "Deny"
): AuthResponse {
    return {
        principalId: "cpo",
        policyDocument: {
            Version: "2012-10-17",
            Statement: [
                {
                    Action: "execute-api:Invoke",
                    Effect: effect,
                    Resource: METHOD_ARN
                }
            ]
        },
        context: {
            dtCpoId: `[${cpoId ? '"' + cpoId + '"' : ""}]`
        }
    };
}
