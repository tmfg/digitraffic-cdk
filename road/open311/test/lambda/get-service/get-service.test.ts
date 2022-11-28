import { handler } from "../../../lib/lambda/get-service/lambda-get-service";
import { newService } from "../../testdata";
import * as ServicesService from "../../../lib/db/services";
import { dbTestBase } from "../../db-testutil";
import { NOT_FOUND_MESSAGE } from "@digitraffic/common/dist/aws/types/errors";

// test file
/* eslint-disable camelcase */

describe(
    "lambda-get-service",
    dbTestBase((db) => {
        test("Unknown service throws error", () => {
            expect(handler({ service_id: "123" })).rejects.toEqual(
                new Error(NOT_FOUND_MESSAGE)
            );
        });

        test("Get", async () => {
            const sr = newService();
            await ServicesService.update([sr], db);

            const response = await handler({
                service_id: sr.service_code,
            });

            expect(response).toMatchObject(sr);
        });
    })
);
