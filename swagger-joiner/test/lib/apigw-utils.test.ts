import {exportSwaggerApi, getDocumentationVersion, createDocumentationVersion} from "../../lib/apigw-utils";
import * as sinon from 'sinon';
import * as AWS from 'aws-sdk';

describe('apigw-utils', () => {

    const sandbox = sinon.createSandbox();
    afterEach(() => sandbox.restore());

    test('exportSwaggerApi', async () => {
        const apiId = 'some-api-id';
        const getExportStub = sandbox.stub().returns({promise: () => new Promise<void>((resolve) => resolve())});
        sandbox.stub(AWS, 'APIGateway').returns({
            getExport: getExportStub
        });

        await exportSwaggerApi(apiId);

        expect(getExportStub.getCall(0).args[0]).toMatchObject({
            exportType: 'swagger',
            restApiId: apiId,
            stageName: 'prod'
        });
    });

    test('getDocumentationVersion', async () => {
        const apiId = 'some-api-id';
        const getDocumentationVersionsStub = sandbox.stub().returns({promise: () => new Promise<void>((resolve) => resolve())});
        sandbox.stub(AWS, 'APIGateway').returns({
            getDocumentationVersions: getDocumentationVersionsStub
        });

        await getDocumentationVersion(apiId, new AWS.APIGateway());

        expect(getDocumentationVersionsStub.getCall(0).args[0]).toMatchObject({
            restApiId: apiId,
        });
    });

    test('createDocumentationVersion', async () => {
        const apiId = 'some-api-id';
        const docVersion = Math.ceil(10 * Math.random());
        const createDocumentationVersionStub = sandbox.stub().returns({promise: () => new Promise<void>((resolve) => resolve())});
        sandbox.stub(AWS, 'APIGateway').returns({
            createDocumentationVersion: createDocumentationVersionStub
        });

        await createDocumentationVersion(apiId, docVersion, new AWS.APIGateway());

        expect(createDocumentationVersionStub.getCall(0).args[0]).toMatchObject({
            restApiId: apiId,
            stageName: 'prod',
            documentationVersion: (docVersion + 1).toString()
        });
    });

});
