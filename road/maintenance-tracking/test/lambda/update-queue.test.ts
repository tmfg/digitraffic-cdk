import {SQS_BUCKET_NAME, SQS_QUEUE_URL} from "../../lib/lambda/constants";
process.env[SQS_BUCKET_NAME] = 'sqs-bucket-name';
process.env[SQS_QUEUE_URL] = 'https://aws-queue-123';
process.env.AWS_REGION = 'aws-region';
import * as pgPromise from "pg-promise";
import {dbTestBase} from "../db-testutil";
import * as SqsBigPayload from "../../lib/service/sqs-big-payload"
import {getRandompId, getTrackingJsonWith3Observations} from "../testdata";
import * as sinon from 'sinon';
import * as LambdaUpdateQueue from "../../lib/lambda/update-queue/lambda-update-queue";
import { SqsProducer } from 'sns-sqs-big-payload';

function createSqsProducerForTest() : SqsProducer {
    return SqsBigPayload.createSqsProducer(`${process.env[SQS_QUEUE_URL]}`, `${process.env.AWS_REGION}`, `${process.env[SQS_BUCKET_NAME]}`);
}

describe('update-queue', dbTestBase((db: pgPromise.IDatabase<any, any>) => {

    const sandbox = sinon.createSandbox();
    afterEach(() => sandbox.restore());

    test('no records - should reject', async () => {
        const sqsClient: SqsProducer = createSqsProducerForTest();
        const sendMessageStub = sandbox.stub(sqsClient, 'sendJSON').returns(Promise.resolve());

        await expect(() => LambdaUpdateQueue.handlerFn(sqsClient)({}))
            .rejects.toMatchObject(LambdaUpdateQueue.invalidRequest("Empty message"));

        expect(sendMessageStub.notCalled).toBe(true);
    });


    test('single valid record', async () => {
        const jsonString = getTrackingJsonWith3Observations(getRandompId(), getRandompId());
        const sqsClient: SqsProducer = createSqsProducerForTest();
        const sendMessageStub = sandbox.stub(sqsClient, 'sendJSON').returns(Promise.resolve());

        await expect(LambdaUpdateQueue.handlerFn(sqsClient)({body: jsonString})).resolves.toMatchObject(LambdaUpdateQueue.ok());

        expect(sendMessageStub.calledWith(JSON.parse(jsonString))).toBe(true);
    });

    test('invalid record', async () => {
        const json = `invalid json ` + getTrackingJsonWith3Observations(getRandompId(), getRandompId());
        const sqsClient: SqsProducer = createSqsProducerForTest();
        const sendMessageStub = sandbox.stub(sqsClient, 'sendJSON');

        await expect(() => LambdaUpdateQueue.handlerFn(sqsClient)(
                {
                    body: json
                }
            )).rejects.toMatchObject(LambdaUpdateQueue.invalidRequest("Error while sending message to SQS: SyntaxError: Unexpected token i in JSON at position 0"));

        expect(sendMessageStub.notCalled).toBe(true);
    });
}));