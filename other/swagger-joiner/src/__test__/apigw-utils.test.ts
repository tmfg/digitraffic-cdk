import { APIGatewayClient } from "@aws-sdk/client-api-gateway";
import { jest } from "@jest/globals";
import _ from "lodash";

const mockSend = jest.fn(() => Promise.resolve({ items: [] }));
jest.spyOn(APIGatewayClient.prototype, "send").mockImplementation(mockSend);

import { exportSwaggerApi, getDocumentationVersion, createDocumentationVersion } from "../apigw-utils.js";

const TEST_API_ID = "some-api-id" as const;

function expectAGCall(expectedClass: string, expected: unknown): void {
    expect(mockSend).toHaveBeenCalled();

    const parameterClass = _.get(mockSend.mock.calls[0], "[0].constructor.name");
    const input = _.get(mockSend.mock.calls[0], "[0].input");

    expect(parameterClass).toEqual(expectedClass);
    expect(input).toEqual(expected);
}

describe("apigw-utils", () => {
    test("exportSwaggerApi", async () => {
        await exportSwaggerApi(TEST_API_ID);

        expectAGCall("GetExportCommand", {
            exportType: "oas30",
            restApiId: TEST_API_ID,
            stageName: "prod"
        });
    });

    test("getDocumentationVersion", async () => {
        await getDocumentationVersion(TEST_API_ID, new APIGatewayClient());

        expectAGCall("GetDocumentationVersionsCommand", {
            limit: 500,
            restApiId: TEST_API_ID
        });
    });

    test("createDocumentationVersion", async () => {
        const docVersion = Math.ceil(10 * Math.random());

        await createDocumentationVersion(TEST_API_ID, docVersion, new APIGatewayClient());

        expectAGCall("CreateDocumentationVersionCommand", {
            restApiId: TEST_API_ID,
            stageName: "prod",
            documentationVersion: `${docVersion + 1}`
        });
    });
});
