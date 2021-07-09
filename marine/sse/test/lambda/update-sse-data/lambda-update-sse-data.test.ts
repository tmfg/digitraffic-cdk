import * as pgPromise from "pg-promise";
import * as DbTestutil  from "../../db-testutil";
import * as sinon from 'sinon';
import * as LambdaUpdateSseData from "../../../lib/lambda/update-sse-data/lambda-update-sse-data";
import * as SseUpdateService from "../../../lib/service/sse-update-service";
const fs = require('fs');

// empty sec usage function for tests
const NOOP_WITH_SECRET = (secretId: string, fn: (secret: any) => Promise<void>) => fn({});


describe('update-sse-data-test', DbTestutil.dbTestBase((db: pgPromise.IDatabase<any, any>) => {

    const sandbox = sinon.createSandbox();
    afterEach(() => sandbox.restore());

    test('handle data post', async () => {
        const json = fs.readFileSync('test/data/example-sse-report.json', 'utf8');
        const data = JSON.parse(json);
        const saveDataStub = sandbox.stub(SseUpdateService, 'saveSseData').returns(Promise.resolve(1));

        const retVal = { "body": "{ \"count\": 3 }", "statusCode": 200 }
        await expect(
            LambdaUpdateSseData.handlerFn(NOOP_WITH_SECRET)(
                {
                    body: json
                }
            )
        ).resolves.toStrictEqual(retVal);

        expect(saveDataStub.calledWith(data)).toBe(true);
    });

}));