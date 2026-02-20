import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { z } from "zod";
import { getActiveMessagesLambdaEvent } from "../../model/zod-schema/lambda-event.js";
import { getActiveMessages } from "../../service/get-message.js";

export const handler = async (
  event: Record<string, string>,
): Promise<LambdaResponse> => {
  const parsedEvent = getActiveMessagesLambdaEvent.safeParse(event);
  if (!parsedEvent.success) {
    return LambdaResponse.badRequest(
      JSON.stringify(z.flattenError(parsedEvent.error).fieldErrors),
    );
  }
  const messages = await getActiveMessages(
    parsedEvent.data.train_number,
    parsedEvent.data.train_departure_date,
    parsedEvent.data.station,
    parsedEvent.data.only_general,
  );
  return LambdaResponse.okJson(messages);
};
