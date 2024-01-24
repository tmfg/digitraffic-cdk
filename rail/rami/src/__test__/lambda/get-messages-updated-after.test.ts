import { parseISO } from "date-fns";
import { handler } from "../../lambda/get-messages-updated-after/get-messages-updated-after.js";
import { dbTestBase } from "../db-testutil.js";
import { getMessagesUpdatedAfterLambdaEvent as lambdaEventSchema } from "../../model/zod-schema/lambda-event.js";

describe(
    "get-messages-updated-after lambda",
    dbTestBase(() => {
        test("handler - valid parameters", async () => {
            const result = await handler(createGetMessagesUpdatedAfterLambdaEvent({ date: "2023-01-01" }));
            expect(result.status).toEqual(200);
        });
        test("handler - invalid parameters", async () => {
            const result = await handler(createGetMessagesUpdatedAfterLambdaEvent({ date: "abc" }));
            expect(result.status).toEqual(400);
        });
        test("handler - date parsing", () => {
            const dateString = "2023-01-01T12:00Z";
            const lambdaEventMessage = createGetMessagesUpdatedAfterLambdaEvent({ date: dateString });
            const parsedEvent = lambdaEventSchema.safeParse(lambdaEventMessage);
            expect(parsedEvent.success);
            if (parsedEvent.success) {
                expect(parsedEvent.data).toEqual({ date: parseISO(dateString) });
            }
        });
    })
);

function createGetMessagesUpdatedAfterLambdaEvent(params: {
    date?: string;
    train_number?: string;
    train_departure_date?: string;
    station?: string;
    only_general?: string;
    only_active?: string;
}): Record<string, string> {
    return {
        date: params.date ?? "",
        train_number: params.train_number ?? "",
        train_departure_date: params.train_departure_date ?? "",
        station: params.station ?? "",
        only_general: params.only_general ?? "",
        only_active: params.only_active ?? ""
    };
}
