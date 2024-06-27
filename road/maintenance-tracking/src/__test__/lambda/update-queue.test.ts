import { MaintenanceTrackingEnvKeys } from "../../keys.js";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import * as sinon from "sinon";
import type { SqsProducer } from "sns-sqs-big-payload";
import * as LambdaUpdateQueue from "../../lambda/update-queue/update-queue.js";
import * as SqsBigPayload from "../../service/sqs-big-payload.js";
import { getRandompId, getTrackingJsonWith3Observations } from "../testdata.js";
import type { APIGatewayEvent } from "aws-lambda";

process.env[MaintenanceTrackingEnvKeys.SQS_BUCKET_NAME] = "sqs-bucket-name";
process.env[MaintenanceTrackingEnvKeys.SQS_QUEUE_URL] = "https://aws-queue-123";
// eslint-disable-next-line dot-notation
process.env["AWS_REGION"] = "aws-region";
const testEvent = (await import("../test-apigw-event.json")) as unknown as APIGatewayEvent;

function createSqsProducerForTest(): SqsProducer {
    return SqsBigPayload.createSqsProducer(
        getEnvVariable(MaintenanceTrackingEnvKeys.SQS_QUEUE_URL),
        getEnvVariable("AWS_REGION"),
        getEnvVariable(MaintenanceTrackingEnvKeys.SQS_BUCKET_NAME)
    );
}

describe("update-queue", () => {
    const sandbox = sinon.createSandbox();
    afterEach(() => sandbox.restore());

    test("no records - should reject", async () => {
        const sqsClient: SqsProducer = createSqsProducerForTest();
        const sendMessageStub = sandbox.stub(sqsClient, "sendJSON").returns(Promise.resolve());

        await expect(() =>
            LambdaUpdateQueue.handlerFn(sqsClient)({ ...testEvent, body: null })
        ).rejects.toMatchObject(LambdaUpdateQueue.invalidRequest("Empty message"));

        expect(sendMessageStub.notCalled).toBe(true);
    });

    test("single valid record", async () => {
        const jsonString = getTrackingJsonWith3Observations(getRandompId(), getRandompId());
        const sqsClient: SqsProducer = createSqsProducerForTest();
        const sendMessageStub = sandbox.stub(sqsClient, "sendJSON").returns(Promise.resolve());

        await expect(
            LambdaUpdateQueue.handlerFn(sqsClient)({
                ...testEvent,
                body: jsonString
            })
        ).resolves.toMatchObject(LambdaUpdateQueue.ok());

        expect(sendMessageStub.calledWith(JSON.parse(jsonString))).toBe(true);
    });

    test("invalid record", async () => {
        const json = `invalid json ` + getTrackingJsonWith3Observations(getRandompId(), getRandompId());
        const sqsClient: SqsProducer = createSqsProducerForTest();
        const sendMessageStub = sandbox.stub(sqsClient, "sendJSON");

        await expect(() =>
            LambdaUpdateQueue.handlerFn(sqsClient)({ ...testEvent, body: json })
        ).rejects.toMatchObject(
            LambdaUpdateQueue.invalidRequest(
                "Error while sending message to SQS: SyntaxError: Unexpected token i in JSON at position 0"
            )
        );

        expect(sendMessageStub.notCalled).toBe(true);
    });
});
