import { insertMessage } from "../../dao/message";
import { lambdaEventSchema, handler } from "../../lambda/get-active-messages/get-active-messages";
import { dbTestBase } from "../db-testutil";
import { createDtRamiMessage } from "../testdata-util";

describe(
    "get-active-messages lambda",
    dbTestBase(() => {
        test("handler - valid parameters", async () => {
            const message = createDtRamiMessage({
                trainNumber: 1
            });
            await insertMessage(message);
            const result = await handler(createGetMessagesLambdaEvent("1"));
            expect(result.status).toEqual(200);
        });
        test("handler - invalid parameters", async () => {
            await insertMessage(createDtRamiMessage({}));
            const result = await handler(createGetMessagesLambdaEvent("0"));
            expect(result.status).toEqual(400);
        });
        test("parse lambda event - no parameters", () => {
            const lambdaEventMessage = createGetMessagesLambdaEvent();
            const parsedEvent = lambdaEventSchema.safeParse(lambdaEventMessage);
            expect(parsedEvent.success);
            if (parsedEvent.success)
                expect(Object.values(parsedEvent.data)).toEqual([undefined, undefined, undefined, undefined]);
        });
        test("parse lambda event - parameters", () => {
            const lambdaEventMessage = createGetMessagesLambdaEvent("1");
            const parsedEvent = lambdaEventSchema.safeParse(lambdaEventMessage);
            expect(parsedEvent.success);
            if (parsedEvent.success) expect(parsedEvent.data.train_number).toEqual(1);
        });
    })
);

function createGetMessagesLambdaEvent(
    train_number: string = "",
    train_departure_date: string = "",
    station: string = "",
    only_general: string = ""
): Record<string, string> {
    return {
        train_number,
        train_departure_date,
        station,
        only_general
    };
}
