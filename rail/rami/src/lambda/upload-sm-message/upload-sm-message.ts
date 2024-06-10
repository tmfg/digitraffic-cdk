import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { validateIncomingSmMessage } from "../../service/validate-message.js";

export const handler = (messageBody: object | undefined): LambdaResponse => {
    if (messageBody) {
        const validationResult = validateIncomingSmMessage(messageBody);

        if(validationResult.valid) {
            logger.info({
                method: "UploadSMMessage.handler",
                message: "Received message",
                customValidRamiMessage: JSON.stringify(messageBody)
            });
        } else {
            logger.error({
                method: "UploadSMMessage.handler",
                message: "Received invalid message",
                customInvalidRamiMessage: JSON.stringify(messageBody)
            });
        }

        return LambdaResponse.ok("OK");
    }
    return LambdaResponse.badRequest("Empty message body");
};
