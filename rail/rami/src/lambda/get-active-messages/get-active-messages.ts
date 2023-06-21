import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response.js";
import { z } from "zod";
import { getActiveMessages } from "../../service/get-message.js";

// absent query parameters exist in lambda event as empty strings -> transform to undefined
export const lambdaEventSchema = z.object({
    train_number: z.coerce
        .number()
        .min(1)
        .or(z.literal("").transform(() => undefined))
        .optional(),
    train_departure_date: z
        .string()
        .regex(/^\d{4}\-\d{2}\-\d{2}$/, "train_departure_date should be in format yyyy-MM-dd")
        .or(z.literal("").transform(() => undefined))
        .optional(),
    station: z
        .string()
        .min(1)
        .or(z.literal("").transform(() => undefined))
        .optional(),
    only_general: z
        .literal("true")
        .transform(() => true)
        .or(z.literal("").transform(() => undefined))
        .optional()
});

export type GetActiveMessagesEvent = z.infer<typeof lambdaEventSchema>;

export const handler = async (event: Record<string, string>): Promise<LambdaResponse> => {
    const parsedEvent = lambdaEventSchema.safeParse(event);
    if (!parsedEvent.success) {
        return LambdaResponse.badRequest(JSON.stringify(parsedEvent.error.flatten().fieldErrors));
    }
    const messages = await getActiveMessages(
        parsedEvent.data.train_number,
        parsedEvent.data.train_departure_date,
        parsedEvent.data.station,
        parsedEvent.data.only_general
    );
    return LambdaResponse.okJson(messages);
};
