import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { getMessagesUpdatedAfterLambdaEvent as lambdaEventSchema } from "../../model/zod-schema/lambda-event.js";
import { getMessagesUpdatedAfter } from "../../service/get-message.js";

export const handler = async (event: Record<string, string>): Promise<LambdaResponse> => {
    const parsedEvent = lambdaEventSchema.safeParse(event);
    if (!parsedEvent.success) {
        return LambdaResponse.badRequest(JSON.stringify(parsedEvent.error.flatten().fieldErrors));
    }
    const messages = await getMessagesUpdatedAfter(
        parsedEvent.data.date,
        parsedEvent.data.train_number,
        parsedEvent.data.train_departure_date,
        parsedEvent.data.station,
        parsedEvent.data.only_general,
        parsedEvent.data.only_active
    );
    return LambdaResponse.okJson(messages);
};
