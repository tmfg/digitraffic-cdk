import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { validateIncomingSmMessage } from "../../service/validate-message.js";
import { sendDlq, sendSmMessage } from "../../service/sqs-service.js";

export const handler = async (messageBody: object | undefined): Promise<LambdaResponse> => {
    if (!messageBody) {
        return LambdaResponse.badRequest("Empty message body");
    }

    const validationResult = validateIncomingSmMessage(messageBody);

    if(validationResult.valid) {
        const body = JSON.stringify(messageBody);

        logger.info({
            method: "UploadSmMessage.handler",
            message: "Received valid SM message",
            customSizeBytes: body.length
        });

        logger.debug(body);

        await sendSmMessage(validationResult);
    } else {
        logger.error({
            method: "UploadSmMessage.handler",
            message: "Received invalid SM message",
            customInvalidSmMessage: JSON.stringify(messageBody),
            customValidationErrors: validationResult.errors
        });

        // send invalid message and error report to dlq
        await sendDlq(validationResult, messageBody);     
    }

    return LambdaResponse.ok("OK");

};
