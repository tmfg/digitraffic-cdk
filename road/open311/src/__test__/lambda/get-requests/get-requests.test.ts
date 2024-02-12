import { handler } from "../../../lambda/get-requests/lambda-get-requests.js";
import { newServiceRequest } from "../../testdata.js";
import { dbTestBase, insertServiceRequest } from "../../db-testutil.js";
import type { ServiceRequest } from "../../../model/service-request.js";

describe(
    "lambda-get-requests",
    dbTestBase((db) => {
        test("no service requests", async () => {
            const response = await handler({ extensions: "false" });

            expect(response).toMatchObject([]);
        });

        test("some service requests", async () => {
            const serviceRequests = Array.from({
                length: Math.floor(Math.random() * 10)
            }).map(() => newServiceRequest());
            await insertServiceRequest(db, serviceRequests);

            const response = await handler({ extensions: "false" });

            expect(response.length).toBe(serviceRequests.length);
        });

        test("extensions", async () => {
            await insertServiceRequest(db, [newServiceRequest()]);

            const response = (await handler({ extensions: "true" })) as unknown as (ServiceRequest & {
                extended_attributes: unknown;
            })[];

            expect(response[0]!.extended_attributes).toBeDefined();
        });

        test("no extensions", async () => {
            await insertServiceRequest(db, [newServiceRequest()]);

            const response = (await handler({ extensions: "false" })) as unknown as (ServiceRequest & {
                extended_attributes: unknown;
            })[];

            expect(response[0]!.extended_attributes).toBeUndefined();
        });
    })
);
