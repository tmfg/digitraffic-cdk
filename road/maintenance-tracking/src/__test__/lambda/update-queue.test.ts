import { setTestEnv } from "../test-env.js";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import type { APIGatewayEvent } from "aws-lambda";
import { getRandompId, getTrackingJsonWith3Observations } from "../testdata.js";
import { jest } from "@jest/globals";
import { MaintenanceTrackingEnvKeys } from "../../keys.js";
import type { SendMessageCommandInput } from "@aws-sdk/client-sqs";
import { createExtendedSqsClient } from "../../service/sqs-big-payload.js";

setTestEnv();

const { handlerFn, invalidRequest, ok } = await import("../../lambda/update-queue/update-queue.js");
const testEvent = await import("../test-apigw-event.json") as unknown as APIGatewayEvent;


describe("update-queue", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("no records - should reject", async () => {
        const sqsClient = createExtendedSqsClient();
        const sendMessageStub = jest
            .spyOn(sqsClient, "sendMessage")
            .mockReturnValue(await Promise.resolve());

        await expect(() =>
            handlerFn(sqsClient)({ ...testEvent, body: null })
        ).rejects.toMatchObject(invalidRequest("Empty message"));

        expect(sendMessageStub).toHaveBeenCalledTimes(0);
    });

    test("single valid record", async () => {
        const jsonString = getTrackingJsonWith3Observations(getRandompId(), getRandompId());
        const sqsClient = createExtendedSqsClient();
        const sendMessageStub = jest
            .spyOn(sqsClient, "sendMessage")
            .mockReturnValue(await Promise.resolve());

        await expect(
            handlerFn(sqsClient)({
                ...testEvent,
                body: jsonString
            })
        ).resolves.toMatchObject(ok());


        const sendCommand: SendMessageCommandInput = {
            QueueUrl: getEnvVariable(MaintenanceTrackingEnvKeys.SQS_QUEUE_URL),
            MessageBody: jsonString
        };

        expect(sendMessageStub).toHaveBeenCalledWith(sendCommand);
        expect(sendMessageStub).toHaveBeenCalledTimes(1);
    });

    test("invalid record", async () => {
        const json = `invalid json ` + getTrackingJsonWith3Observations(getRandompId(), getRandompId());
        const sqsClient = createExtendedSqsClient();
        const sendMessageStub = jest
            .spyOn(sqsClient, "sendMessage")
            .mockReturnValue(await Promise.resolve());

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
