import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { validateIncomingRosmMessage } from "../../service/validate-message.js";
import { sendDlq, sendRosmMessage } from "../../service/sqs-service.js";

export const handler = async (messageBody: object | undefined): Promise<LambdaResponse> => {
    if (messageBody) {
        const validationResult = validateIncomingRosmMessage(messageBody);
        if (validationResult.valid) {
            // should this be debug?
            logger.info({
                method: "UploadRamiMessage.handler",
                message: "Received valid RAMI message",
                customValidRosmMessage: JSON.stringify(messageBody)
            });

            await sendRosmMessage(validationResult);

            return LambdaResponse.ok("OK");
        } else {
            logger.warn({
                method: "UploadRamiMessage.handler",
                message: "Received invalid RAMI message",
                customInvalidRosmMessage: JSON.stringify(messageBody),
                customValidationErrors: validationResult.errors
            });
            // send invalid message and error report to dlq
            await sendDlq(validationResult, messageBody);

            return LambdaResponse.badRequest(validationResult.errors);
        }
    }
    return LambdaResponse.badRequest("Empty message body");
};
