import {SecretHolder} from "digitraffic-common/aws/runtime/secrets/secret-holder";
import * as sinon from 'sinon';
import * as LambdaUpdateSseData from "../../../lib/lambda/update-sse-data/lambda-update-sse-data";
import * as SseUpdateService from "../../../lib/service/sse-update-service";
import * as DbTestutil from "../../db-testutil";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');

describe('update-sse-data-test', DbTestutil.dbTestBase(() => {

    const sandbox = sinon.createSandbox();
    afterEach(() => sandbox.restore());

    test('handle data post', async () => {
        const json = fs.readFileSync('test/data/example-sse-report.json', 'utf8');
        const data = JSON.parse(json);
        const saveDataStub = sandbox.stub(SseUpdateService, 'saveSseData').returns(Promise.resolve({ saved: 3, errors: 0} ));

        const retVal = { saved: 3, errors: 0};

        sinon.stub(SecretHolder.prototype, 'setDatabaseCredentials').returns(Promise.resolve());

        await expect(LambdaUpdateSseData.handler(data)).resolves.toStrictEqual(retVal);

        expect(saveDataStub.calledWith(data)).toBe(true);
    });

}));