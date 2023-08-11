import { parseISO } from "date-fns";
import { handler } from "../../lambda/get-messages-updated-after/get-messages-updated-after";
import { dbTestBase } from "../db-testutil";
import { getMessagesUpdatedAfterLambdaEvent as lambdaEventSchema } from "../../model/zod-schema/lambda-event";

describe(
    "get-messages-updated-after lambda",
    dbTestBase(() => {
        test("handler - valid parameters", async () => {
            const result = await handler(createGetMessagesUpdatedAfterLambdaEvent("2023-01-01"));
            expect(result.status).toEqual(200);
        });
        test("handler - invalid parameters", async () => {
            const result = await handler(createGetMessagesUpdatedAfterLambdaEvent("abc"));
            expect(result.status).toEqual(400);
        });
        test("handler - date parsing", () => {
            const dateString = "2023-01-01T12:00Z";
            const lambdaEventMessage = createGetMessagesUpdatedAfterLambdaEvent(dateString);
            const parsedEvent = lambdaEventSchema.safeParse(lambdaEventMessage);
            expect(parsedEvent.success);
            if (parsedEvent.success)
                expect(Object.values(parsedEvent.data)).toEqual([
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    parseISO(dateString),
                    undefined
                ]);
        });
    })
);

function createGetMessagesUpdatedAfterLambdaEvent(
    date: string = "",
    train_number: string = "",
    train_departure_date: string = "",
    station: string = "",
    only_general: string = "",
    only_active: string = ""
): Record<string, string> {
    return {
        date,
        train_number,
        train_departure_date,
        station,
        only_general,
        only_active
    };
}
