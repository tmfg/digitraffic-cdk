import {SQS_BUCKET_NAME, SQS_QUEUE_URL} from "../../lib/lambda/constants";
process.env[SQS_BUCKET_NAME] = 'sqs-bucket-name';
process.env[SQS_QUEUE_URL] = 'https://aws-queue-123';
import * as pgPromise from "pg-promise";
import {dbTestBase} from "../db-testutil";
import {getRandompId, getTrackingJsonWith3Observations} from "../testdata";
import * as sinon from 'sinon';

describe('update-queue', dbTestBase((db: pgPromise.IDatabase<any, any>) => {

    const sandbox = sinon.createSandbox();
    afterEach(() => sandbox.restore());

    // test('no records', async () => {
    //     const sqsClient: any = createSQSExtClient("bucket-name");
    //     const sendMessageStub = sandbox.stub(sqsClient, 'sendMessage').returns({promise: () => Promise.resolve()});
    //     await expect(handlerFn(sqsClient)).rejects;
    //     expect(sendMessageStub.notCalled).toBe(true);
    // });
    //
    // test('single valid record', async () => {
    //     const json = getTrackingJsonWith3Observations(getRandompId(), getRandompId());
    //
    //     const sqsClient: any = createSQSExtClient("bucket-name");
    //     const sendMessageStub = sandbox.stub(sqsClient, 'sendMessage').returns({promise: () => Promise.resolve()});
    //
    //     await expect(
    //         handlerFn(sqsClient)(
    //             {
    //                 body: json
    //             }
    //         )
    //     ).resolves;
    //
    //     const params = createSendParams(json);
    //     expect(sendMessageStub.calledWith(params)).toBe(true);
    // });
    //
    // test('invalid record', async () => {
    //     const json = `invalid json ` + getTrackingJsonWith3Observations(getRandompId(), getRandompId());
    //     const sqsClient: any = createSQSExtClient("bucket-name");
    //     const sendMessageStub = sandbox.stub(sqsClient, 'sendMessage').returns({promise: () => Promise.resolve()});
    //
    //     await expect(
    //         handlerFn(sqsClient)(
    //             {
    //                 body: json
    //             }
    //         )
    //     ).rejects;
    //
    //     const params = createSendParams(json);
    //     expect(sendMessageStub.calledWith(params)).toBe(true);
    // });

}));