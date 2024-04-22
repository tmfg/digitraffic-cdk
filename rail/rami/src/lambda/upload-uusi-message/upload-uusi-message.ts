import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";

export const handler = (messageBody: object | undefined): LambdaResponse => {
    if (messageBody) {
        logger.info({
            method: "UploadUusiMessage.handler",
            message: "Received message",
            customValidRamiMessage: JSON.stringify(messageBody)
        });

    }
    return LambdaResponse.badRequest("Empty message body");
};
