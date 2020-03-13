import {exportSwaggerApi} from "../../lib/apigw-utils";
import * as sinon from 'sinon';
import * as AWS from 'aws-sdk';

describe('apigw-utils', () => {

    test('exportSwaggerApi', async () => {
        const apiId = 'some-api-id';
        const getExportStub = sinon.stub().returns({promise: () => new Promise((resolve) => resolve())});
        sinon.stub(AWS, 'APIGateway').returns({
            getExport: getExportStub
        });

        await exportSwaggerApi(apiId);

        expect(getExportStub.getCall(0).args[0]).toMatchObject({
            exportType: 'swagger',
            restApiId: apiId,
            stageName: 'prod'
        });
    });

});
