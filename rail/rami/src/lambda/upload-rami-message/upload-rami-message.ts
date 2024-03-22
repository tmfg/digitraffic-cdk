import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { validateIncomingRamiMessage } from "../../service/validate-message.js";
import { sendToSqs } from "../../util/sqs.js";

const SQS_URL = getEnvVariable("SQS_URL");
const DLQ_URL = getEnvVariable("DLQ_URL");

export const handler = async (messageBody: object | undefined): Promise<LambdaResponse> => {
    if (messageBody) {
        const validationResult = validateIncomingRamiMessage(messageBody);
        if (validationResult.valid) {
            logger.info({
                method: "UploadRamiMessage.handler",
                message: "Received valid RAMI message",
                customValidRamiMessage: JSON.stringify(messageBody)
            });
            const messageId = validationResult.value.payload.messageId;
            await sendToSqs(SQS_URL, 2, JSON.stringify(validationResult.value), messageId);
            return LambdaResponse.ok("OK");
        } else {
            logger.warn({
                method: "UploadRamiMessage.handler",
                message: "Received invalid RAMI message",
                customInvalidRamiMessage: JSON.stringify(messageBody),
                customValidationErrors: validationResult.errors
            });
            // send invalid message and error report to dlq
            await sendToSqs(
                DLQ_URL,
                2,
                `[{"errors":"${validationResult.errors}"}, ${JSON.stringify(messageBody)}]`
            );
            return LambdaResponse.badRequest(validationResult.errors);
        }
    }
    return LambdaResponse.badRequest("Empty message body");
};
