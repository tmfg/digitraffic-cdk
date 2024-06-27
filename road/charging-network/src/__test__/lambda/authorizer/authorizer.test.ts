import { dbTestBase, insertOcpiCpo, setTestEnv } from "../../db-testutil";
setTestEnv();
import { APIGatewayAuthorizerResult, APIGatewayEventRequestContextWithAuthorizer, Context } from "aws-lambda";
import {
    APIGatewayRequestAuthorizerEvent,
    APIGatewayRequestAuthorizerEventHeaders
} from "aws-lambda/trigger/api-gateway-authorizer";
import each from "jest-each";
import * as sinon from "sinon";
import { handler } from "../../../lib/lambda/authorizer/authorizer";
import * as OcpiRegistrationService from "../../../lib/service/ocpi-registration-service";
import { CPO_TOKEN_A, CPO_VERSIONS_ENPOINT, DT_CPO_ID, CPO_NAME as DT_CPO_NAME } from "../../test-constants";
import _ from "lodash";

const sandbox = sinon.createSandbox();
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

        afterEach(() => sandbox.restore());

        each([
            {
                name: "authorize-success-valid-token",
                cpoToken: CPO_TOKEN_B,
                handlerCallbackCount: 1,
                authorizerResultCpoId: DT_CPO_ID,
                effect: "Allow"
            } satisfies Params,
            {
                name: "authorize-fails-invalid-token",
                cpoToken: OcpiRegistrationService.generateToken(), // This token in request is not found from db
                handlerCallbackCount: 1,
                authorizerResultCpoId: undefined,
                effect: "Deny"
            } satisfies Params,
            {
                name: "authorize-fails-missing-token",
                cpoToken: undefined, // Token in request is missing
                handlerCallbackCount: 1,
                authorizerResultCpoId: undefined,
                effect: "Deny"
            } satisfies Params
        ]).test("Test lambda authorizer: $name", async (testParams: Params) => {
            const authorizerEvent = createAPIGatewayRequestAuthorizerEvent(testParams.cpoToken);

            const callback = sinon.spy();
            // Call authorizer lambda with apigw event that contains cpo token_b
            await handler(authorizerEvent, {} as Context, callback);

            expect(callback.callCount).toBe(testParams.handlerCallbackCount);
            const [error, authorizerResult] = callback.getCall(0).args as [
                Error | string | null,
                APIGatewayAuthorizerResult
            ];

            console.log(authorizerResult);

            expect(error).toBe(null);
            const expectedAuthorizerResultCpoIdValue = testParams.authorizerResultCpoId
                ? `[\"${testParams.authorizerResultCpoId}\"]`
                : `[]`;
            expect(authorizerResult.context?.dtCpoId).toBe(expectedAuthorizerResultCpoIdValue);

            expect(authorizerResult.policyDocument.Statement[0].Effect).toBe(testParams.effect);
            expect(_.get(authorizerResult, "policyDocument.Statement[0].Resource")).toBe(
                authorizerEvent.methodArn
            );
        });
    })
);

function createAPIGatewayRequestAuthorizerEvent(
    cpoTokenB: string | undefined
): APIGatewayRequestAuthorizerEvent {
    const headers = cpoTokenB
        ? ({
              authorization: `Token ${cpoTokenB}`
          } as APIGatewayRequestAuthorizerEventHeaders)
        : null;

    return {
        type: "REQUEST",
        methodArn: "arn:aws:execute-api:resource",
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
