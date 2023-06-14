import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response.js";
import { parse } from "date-fns";
import { getActiveMessages } from "../../service/get-message.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default.js";

interface GetActiveMessageEvent {
    readonly train_number?: number;
    readonly train_departure_date?: string;
    readonly station?: string;
}

export const handler = async (event: GetActiveMessageEvent): Promise<LambdaResponse> => {
    logger.debug(JSON.stringify(event));
    if (event.train_number && isNaN(event.train_number)) {
        return LambdaResponse.badRequest("trainNumber is not a number");
    }
    if (event.train_departure_date && !parse(event.train_departure_date, "yyyy-MM-dd", new Date())) {
        return LambdaResponse.badRequest("trainDepartureDate should be in format yyyy-MM-dd");
    }
    const messages = await getActiveMessages(event.train_number, event.train_departure_date, event.station);
    logger.debug(JSON.stringify(messages));
    return LambdaResponse.okJson(messages);
};
