import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { validateIncomingRosmMessage } from "../../service/validate-message.js";
import { sendDlq, sendRosmMessage } from "../../service/sqs-service.js";

export const handler = async (messageBody: object | undefined): Promise<LambdaResponse> => {
    if(!messageBody) {
        return LambdaResponse.badRequest("Empty message body");
    }

    const validationResult = validateIncomingRosmMessage(messageBody);
    
    if (validationResult.valid) {            
        const body = JSON.stringify(messageBody);

        logger.info({
            method: "UploadRosmMessage.handler",
            message: "Received valid ROSM message",
            customSizeBytes: body.length
        });

        logger.debug(body);

        await sendRosmMessage(validationResult);
    } else {
        logger.error({
            method: "UploadRosmMessage.handler",
            message: "Received invalid ROSM message",
            customInvalidRosmMessage: JSON.stringify(messageBody),
            customValidationErrors: validationResult.errors
        });
        
        // send invalid message and error report to dlq
        await sendDlq(validationResult.errors, messageBody);     
    }

    return LambdaResponse.ok("OK");
};
