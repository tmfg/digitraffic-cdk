import {
    exportSwaggerApi,
    getDocumentationVersion,
    createDocumentationVersion,
} from "../lib/apigw-utils";
import * as AWS from "aws-sdk";

const stubPromise = (x: unknown) => ({ promise: () => Promise.resolve() });
const apiGWCreateDocumentationVersionStub = jest.fn(stubPromise);
const apiGWGetDocumentationVersionsStub = jest.fn(stubPromise);
const apiGWGetExportStub = jest.fn(stubPromise);

jest.mock("aws-sdk", () => {
    return {
        APIGateway: jest.fn(() => {
            return {
                getExport: apiGWGetExportStub,
                getDocumentationVersions: apiGWGetDocumentationVersionsStub,
                createDocumentationVersion: apiGWCreateDocumentationVersionStub,
            };
        }),
    };
});

describe("apigw-utils", () => {
    const apiGateway = new AWS.APIGateway();

    test("exportSwaggerApi", async () => {
        const apiId = "some-api-id";

        await exportSwaggerApi(apiId);

        expect(apiGWGetExportStub.mock.calls[0][0]).toMatchObject({
            exportType: "oas30",
            restApiId: apiId,
            stageName: "prod",
        });
    });

    test("getDocumentationVersion", async () => {
        const apiId = "some-api-id";

        await getDocumentationVersion(apiId, apiGateway);

        expect(
            apiGWGetDocumentationVersionsStub.mock.calls[0][0]
        ).toMatchObject({
            restApiId: apiId,
        });
    });

    test("createDocumentationVersion", async () => {
        const apiId = "some-api-id";
        const docVersion = Math.ceil(10 * Math.random());

        await createDocumentationVersion(apiId, docVersion, apiGateway);

        expect(
            apiGWCreateDocumentationVersionStub.mock.calls[0][0]
        ).toMatchObject({
            restApiId: apiId,
            stageName: "prod",
            documentationVersion: `${docVersion + 1}`,
        });
    });
});
