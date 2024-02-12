import { handler } from "../../../lambda/get-request/lambda-get-request.js";
import { newServiceRequest } from "../../testdata.js";
import { dbTestBase, insertServiceRequest } from "../../db-testutil.js";
import { NOT_FOUND_MESSAGE } from "@digitraffic/common/dist/aws/types/errors";
import type { ServiceRequest } from "../../../model/service-request.js";

describe(
    "lambda-get-request",
    dbTestBase((db) => {
        test("Not found throws error", () => {
            //eslint-disable-next-line @typescript-eslint/no-floating-promises
            expect(
                handler({
                    request_id: "123",
                    extensions: "false"
                })
            ).rejects.toEqual(new Error(NOT_FOUND_MESSAGE));
        });

        test("Get with extensions", async () => {
            const sr = newServiceRequest();
            await insertServiceRequest(db, [sr]);

            const response = (await handler({
                request_id: sr.service_request_id,
                extensions: "true"
            })) as unknown as ServiceRequest & { extended_attributes: unknown };

            expect(response.extended_attributes).toBeDefined();
        });

        test("Get with no extensions", async () => {
            const sr = newServiceRequest();
            await insertServiceRequest(db, [sr]);

            const response = (await handler({
                request_id: sr.service_request_id,
                extensions: "false"
            })) as unknown as ServiceRequest & { extended_attributes: unknown };

            expect(response.extended_attributes).toBeUndefined();
        });
    })
);
