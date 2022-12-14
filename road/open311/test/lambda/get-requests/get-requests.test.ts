import { handler } from "../../../lib/lambda/get-requests/lambda-get-requests";
import { newServiceRequest } from "../../testdata";
import { dbTestBase, insertServiceRequest } from "../../db-testutil";

describe(
    "lambda-get-requests",
    dbTestBase((db) => {
        test("no service requests", async () => {
            const response = await handler({ extensions: "false" });

            expect(response).toMatchObject([]);
        });

        test("some service requests", async () => {
            const serviceRequests = Array.from({
                length: Math.floor(Math.random() * 10),
            }).map(() => newServiceRequest());
            await insertServiceRequest(db, serviceRequests);

            const response = await handler({ extensions: "false" });

            expect(response.length).toBe(serviceRequests.length);
        });

        test("extensions", async () => {
            await insertServiceRequest(db, [newServiceRequest()]);

            const response = await handler({ extensions: "true" });

            expect((response[0] as any).extended_attributes).toBeDefined();
        });

        test("no extensions", async () => {
            await insertServiceRequest(db, [newServiceRequest()]);

            const response = await handler({ extensions: "false" });

            expect((response[0] as any).extended_attributes).toBeUndefined();
        });
    })
);
