import { z } from "zod";

// absent query parameters exist in lambda event as empty strings -> transform to undefined
const emptyStringToUndefined = z.literal("").transform(() => undefined);
const optionalBoolean = z
    .literal("true")
    .transform(() => true)
    .or(z.literal("false").transform(() => false))
    .or(emptyStringToUndefined)
    .optional();

export const getActiveMessagesLambdaEvent = z.object({
    train_number: z.coerce.number().min(1).or(emptyStringToUndefined).optional(),
    train_departure_date: z
        .string()
        .regex(/^\d{4}\-\d{2}\-\d{2}$/, "train_departure_date should be in format yyyy-MM-dd")
        .or(emptyStringToUndefined)
        .optional(),
    station: z.string().min(2).or(emptyStringToUndefined).optional(),
    only_general: optionalBoolean
});
export type GetActiveMessagesEvent = z.infer<typeof getActiveMessagesLambdaEvent>;

export const getMessagesUpdatedAfterLambdaEvent = z.intersection(
    getActiveMessagesLambdaEvent,
    z.object({
        date: z.coerce.date(),
        only_active: optionalBoolean
    })
);
export type GetMessagesUpdatedAfterEvent = z.infer<typeof getMessagesUpdatedAfterLambdaEvent>;
