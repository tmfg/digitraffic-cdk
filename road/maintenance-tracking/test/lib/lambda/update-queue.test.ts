import {SQS_BUCKET_NAME, SQS_QUEUE_URL} from "../../../lib/lambda/constants";
process.env[SQS_BUCKET_NAME] = 'sqs-bucket-name';
process.env[SQS_QUEUE_URL] = 'https://aws-queue-123';
import * as pgPromise from "pg-promise";
import {dbTestBase, findAll} from "../db-testutil";
import {createSendParams, handlerFn} from "../../../lib/lambda/update-queue/lambda-update-queue";
import {SQSRecord} from "aws-lambda";
import {getRandompId, getTrackingJson} from "../testdata";
import * as sinon from 'sinon';
import {createSQSExtClient} from "../../../lib/sqs-ext";

describe('update-queue', dbTestBase((db: pgPromise.IDatabase<any, any>) => {

    const sandbox = sinon.createSandbox();
    afterEach(() => sandbox.restore());

    test('no records', async () => {
        const sqsClient: any = createSQSExtClient("bucket-name");
        const sendMessageStub = sandbox.stub(sqsClient, 'sendMessage').returns({promise: () => Promise.resolve()});
        await expect(handlerFn(sqsClient)).rejects;
        expect(sendMessageStub.notCalled).toBe(true);
    });

    test('single valid record', async () => {
        const json = getTrackingJson(getRandompId(), getRandompId());

        const sqsClient: any = createSQSExtClient("bucket-name");
        const sendMessageStub = sandbox.stub(sqsClient, 'sendMessage').returns({promise: () => Promise.resolve()});

        await expect(
            handlerFn(sqsClient)(
                {
                    body: json
                }
            )
        ).resolves;

        const params = createSendParams(json);
        expect(sendMessageStub.calledWith(params)).toBe(true);
    });

    test('invalid record', async () => {
        const json = `invalid json ` + getTrackingJson(getRandompId(), getRandompId());
        const sqsClient: any = createSQSExtClient("bucket-name");
        const sendMessageStub = sandbox.stub(sqsClient, 'sendMessage').returns({promise: () => Promise.resolve()});

        await expect(
            handlerFn(sqsClient)(
                {
                    body: json
                }
            )
        ).rejects;

        const params = createSendParams(json);
        expect(sendMessageStub.calledWith(params)).toBe(true);
    });

}));