import { insertMessage } from "../../dao/message.js";
import { handler } from "../../lambda/get-active-messages/get-active-messages.js";
import { getActiveMessagesLambdaEvent as lambdaEventSchema } from "../../model/zod-schema/lambda-event.js";
import { dbTestBase } from "../db-testutil.js";
import { createDtRosmMessage } from "../testdata-util.js";

describe(
    "get-active-messages lambda",
    dbTestBase(() => {
        test("handler - valid parameters", async () => {
            const message = createDtRosmMessage({
                trainNumber: 1
            });
            await insertMessage(message);
            const result = await handler(createGetMessagesLambdaEvent({ train_number: "1" }));
            expect(result.status).toEqual(200);
        });
        test("handler - invalid parameters", async () => {
            await insertMessage(createDtRosmMessage({}));
            const result = await handler(createGetMessagesLambdaEvent({ train_number: "0" }));
            expect(result.status).toEqual(400);
        });
        test("parse lambda event - no parameters", () => {
            const lambdaEventMessage = createGetMessagesLambdaEvent({});
            const parsedEvent = lambdaEventSchema.safeParse(lambdaEventMessage);
            expect(parsedEvent.success);
            if (parsedEvent.success) expect(parsedEvent.data).toEqual({});
        });
        test("parse lambda event - parameters", () => {
            const lambdaEventMessage = createGetMessagesLambdaEvent({ train_number: "1" });
            const parsedEvent = lambdaEventSchema.safeParse(lambdaEventMessage);
            expect(parsedEvent.success);
            if (parsedEvent.success) expect(parsedEvent.data.train_number).toEqual(1);
        });
    })
);

function createGetMessagesLambdaEvent(params: {
    train_number?: string;
    train_departure_date?: string;
    station?: string;
    only_general?: string;
}): Record<string, string> {
    return {
        train_number: params.train_number ?? "",
        train_departure_date: params.train_departure_date ?? "",
        station: params.station ?? "",
        only_general: params.only_general ?? ""
    };
}
