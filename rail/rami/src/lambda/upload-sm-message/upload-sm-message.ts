import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { validateIncomingSmMessage } from "../../service/validate-message.js";
import { sendSmMessage } from "../../service/sqs-service.js";

export const handler = async (messageBody: object | undefined): Promise<LambdaResponse> => {
    if (messageBody) {
        const validationResult = validateIncomingSmMessage(messageBody);

        if(validationResult.valid) {
            await sendSmMessage(validationResult);
        } else {
            logger.error({
                method: "UploadSMMessage.handler",
                message: "Received invalid message",
                customInvalidSmMessage: JSON.stringify(messageBody)
            });
        }

        return LambdaResponse.ok("OK");
    }
    return LambdaResponse.badRequest("Empty message body");
};
