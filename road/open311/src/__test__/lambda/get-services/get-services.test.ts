import { handler } from "../../../lambda/get-services/lambda-get-services.js";
import * as ServicesDb from "../../../db/services.js";
import { newService } from "../../testdata.js";
import { dbTestBase } from "../../db-testutil.js";

describe(
    "lambda-get-services",
    dbTestBase((db) => {
        test("no services", async () => {
            const response = await handler();

            expect(response).toMatchObject([]);
        });

        test("some service services", async () => {
            const services = Array.from({ length: Math.floor(Math.random() * 10) }).map(() => newService());
            await ServicesDb.update(services, db);

            const response = await handler();

            expect(response.length).toBe(services.length);
        });
    })
);
