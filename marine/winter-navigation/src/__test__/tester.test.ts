import { type DTDatabase } from "@digitraffic/common/dist/database/database";
import { update } from "../service/update-service.js";
import { dbTestBase } from "./db-testutil.js";

describe(
    "updater",
    dbTestBase((db: DTDatabase) => {
        test("update", async () => {
            // await update();
        });
    })
);
