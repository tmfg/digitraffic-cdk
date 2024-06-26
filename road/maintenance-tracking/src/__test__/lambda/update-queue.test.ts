import { setEnv } from "../test-env.js";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import type { APIGatewayEvent } from "aws-lambda";
import { type SqsProducer } from "sns-sqs-big-payload";
import * as SqsBigPayload from "../../service/sqs-big-payload.js";
import { getRandompId, getTrackingJsonWith3Observations } from "../testdata.js";
import { jest } from "@jest/globals";
import { MaintenanceTrackingEnvKeys } from "../../keys.js";

setEnv();
// process.env["SQS_BUCKET_NAME"] = "sqs-bucket-name";
// process.env.SQS_QUEUE_URL. = "https://aws-queue-123";
// process.env.AWS_REGION = "aws-region";

const { handlerFn, invalidRequest, ok } = await import("../../lambda/update-queue/update-queue.js");
const testEvent = await import("../test-apigw-event.json") as unknown as APIGatewayEvent;

function createSqsProducerForTest(): SqsProducer {

    return SqsBigPayload.createSqsProducer(
        getEnvVariable(MaintenanceTrackingEnvKeys.SQS_QUEUE_URL),
        getEnvVariable("AWS_REGION"),
        getEnvVariable(MaintenanceTrackingEnvKeys.SQS_BUCKET_NAME)
    );
}

describe("update-queue", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("no records - should reject", async () => {
        const sqsClient: SqsProducer = createSqsProducerForTest();
        const sendMessageStub = jest
            .spyOn(sqsClient, "sendJSON")
            .mockReturnValue(Promise.resolve());
        //const sendMessageStub = sandbox.stub(sqsClient, "sendJSON").returns(Promise.resolve());

        await expect(() =>
            handlerFn(sqsClient)({ ...testEvent, body: null })
        ).rejects.toMatchObject(invalidRequest("Empty message"));

        expect(sendMessageStub).toHaveBeenCalledTimes(0);
    });

    test("single valid record", async () => {
        const jsonString = getTrackingJsonWith3Observations(getRandompId(), getRandompId());
        const sqsClient: SqsProducer = createSqsProducerForTest();
        const sendMessageStub = jest
            .spyOn(sqsClient, "sendJSON")
            .mockReturnValue(Promise.resolve());

        await expect(
            handlerFn(sqsClient)({
                ...testEvent,
                body: jsonString
            })
        ).resolves.toMatchObject(ok());

        expect(sendMessageStub).toHaveBeenCalledWith(JSON.parse(jsonString));
        expect(sendMessageStub).toHaveBeenCalledTimes(1);
    });

    test("invalid record", async () => {
        const json = `invalid json ` + getTrackingJsonWith3Observations(getRandompId(), getRandompId());
        const sqsClient: SqsProducer = createSqsProducerForTest();
        const sendMessageStub = jest
            .spyOn(sqsClient, "sendJSON")
            .mockReturnValue(Promise.resolve());

        await expect(() =>
            handlerFn(sqsClient)({ ...testEvent, body: json })
        ).rejects.toMatchObject(
            invalidRequest(
                `Error while sending message to SQS: SyntaxError: Unexpected token 'i', "invalid js"... is not valid JSON`
            )
        );

        expect(sendMessageStub).toHaveBeenCalledTimes(0);
    });
});
