import { z } from "zod";

// absent query parameters exist in lambda event as empty strings -> transform to undefined
export const getActiveMessagesLambdaEvent = z.object({
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
        .or(z.literal("false").transform(() => false))
        .or(z.literal("").transform(() => undefined))
        .optional()
});
export type GetActiveMessagesEvent = z.infer<typeof getActiveMessagesLambdaEvent>;

export const getMessagesUpdatedAfterLambdaEvent = z.intersection(
    getActiveMessagesLambdaEvent,
    z.object({
        date: z.coerce.date(),
        only_active: z
            .literal("false")
            .transform(() => false)
            .or(z.literal("true").transform(() => true))
            .or(z.literal("").transform(() => undefined))
            .optional()
    })
);
export type GetMessagesUpdatedAfterEvent = z.infer<typeof getActiveMessagesLambdaEvent>;
