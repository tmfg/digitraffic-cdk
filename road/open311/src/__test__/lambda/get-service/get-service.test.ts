import { handler } from "../../../lambda/get-service/lambda-get-service.js";
import { newService } from "../../testdata.js";
import * as ServicesService from "../../../db/services.js";
import { dbTestBase } from "../../db-testutil.js";
import { NOT_FOUND_MESSAGE } from "@digitraffic/common/dist/aws/types/errors";

describe(
    "lambda-get-service",
    dbTestBase((db) => {
        test("Unknown service throws error", () => {
            expect(handler({ service_id: "123" })).rejects.toEqual(new Error(NOT_FOUND_MESSAGE));
        });

        test("Get", async () => {
            const sr = newService();
            await ServicesService.update([sr], db);

            const response = await handler({
                service_id: sr.service_code
            });

            expect(response).toMatchObject(sr);
        });
    })
);
