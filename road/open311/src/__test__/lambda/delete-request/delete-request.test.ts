import { handler } from "../../../lambda/delete-request/lambda-delete-request.js";
import { newServiceRequest } from "../../testdata.js";
import { dbTestBase, insertServiceRequest } from "../../db-testutil.js";

describe(
    "lambda-delete-request",
    dbTestBase((db) => {
        test("Delete", async () => {
            const sr = newServiceRequest();
            await insertServiceRequest(db, [sr]);

            await handler({
                request_id: sr.service_request_id
            });
        });

        test("Delete nonexistent", async () => {
            await handler({
                request_id: "foo"
            });
        });
    })
);
