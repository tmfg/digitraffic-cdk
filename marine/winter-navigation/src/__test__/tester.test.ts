import { type DTDatabase } from "@digitraffic/common/dist/database/database";
import { DataUpdater } from "../service/data-updater.js";
import { dbTestBase } from "./db-testutil.js";

describe(
    "updater",
    dbTestBase((db: DTDatabase) => {
        test("update", async () => {
            const updater = new DataUpdater("", "");
//            await updater.update();
        });
    })
);
