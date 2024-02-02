import { handler } from "../../../lambda/get-request/lambda-get-request.js";
import { newServiceRequest } from "../../testdata.js";
import { dbTestBase, insertServiceRequest } from "../../db-testutil.js";
import { NOT_FOUND_MESSAGE } from "@digitraffic/common/dist/aws/types/errors";

describe(
    "lambda-get-request",
    dbTestBase((db) => {
        test("Not found throws error", () => {
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

            const response = await handler({
                request_id: sr.service_request_id,
                extensions: "true"
            });

            expect((response as any).extended_attributes).toBeDefined();
        });

        test("Get with no extensions", async () => {
            const sr = newServiceRequest();
            await insertServiceRequest(db, [sr]);

            const response = await handler({
                request_id: sr.service_request_id,
                extensions: "false"
            });

            expect((response as any).extended_attributes).toBeUndefined();
        });
    })
);
