import * as sinon from 'sinon';
import {SinonSandbox} from 'sinon';
import * as AWS from 'aws-sdk';
import {
    handler,
    constructSwagger,
    KEY_APIGW_APPS,
    KEY_APP_URL,
    KEY_BUCKET_NAME,
    KEY_REGION, S3_UPLOAD_SETTINGS
} from '../../../lib/lambda/update-swagger/lambda-update-swagger';
import {TestHttpServer} from "../../../../common/test/httpserver";

const SERVER_PORT = 8089;
const apiGwApiIds = ['id1', 'id2'];
process.env[KEY_BUCKET_NAME] = 'some-bucket';
process.env[KEY_REGION] = 'some-region';
process.env[KEY_APP_URL] = `http://localhost:${SERVER_PORT}`;
process.env[KEY_APIGW_APPS] = JSON.stringify(apiGwApiIds);

const appApi = {paths: {'/app/path': {}}};
const apiGwApi1 = {paths: {'/apigw1/path': {}}};
const apiGwApi2 = {paths: {'/apigw2/path': {}}};

describe('update-swagger', () => {
    const sandbox = sinon.createSandbox();
    afterEach(() => sandbox.restore());

    test('test', async (done) => {

        mockApiGwExport(sandbox);

        // mock App API
        const server = new TestHttpServer();
        server.listen(SERVER_PORT, {
            '/': () => {
                return JSON.stringify(appApi);
            }
        });
        // @ts-ignore
        const s3UploadStub = sandbox.stub(AWS.S3.prototype, 'upload').returns({
            promise: () => new Promise((resolve) => resolve())
        });

        try {
            await handler();
            const arg = s3UploadStub.getCall(0).args[0];
            expect(arg).toMatchObject(Object.assign({}, S3_UPLOAD_SETTINGS, {
                Bucket: process.env[KEY_BUCKET_NAME], Body: constructSwagger({
                    paths: {
                        '/app/path': {},
                        '/apigw1/path': {},
                        '/apigw2/path': {}
                    }
                })
            }));
        } catch (e) {
            done(e);
        } finally {
            server.close();
            done();
        }
    });

});

function mockApiGwExport(sandbox: SinonSandbox) {
    let firstInvocation = true;
    const getExportStub = () => ({
        promise: () =>
            new Promise((resolve) => {
                const api = firstInvocation ? apiGwApi2 : apiGwApi1;
                firstInvocation = false;
                resolve({body: JSON.stringify(api)});
            })
    });
    sandbox.stub(AWS, 'APIGateway').returns({
        getExport: getExportStub
    });
}
