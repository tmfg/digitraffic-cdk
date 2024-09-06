import { assertActivityCount, dbTestBase } from "../db-testutil.js";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { jest } from "@jest/globals";
import { type Response } from "../../model/apidata.js";
import type { Deleted, Activity } from "../../model/apidata.js";
import { IbnetApi } from "../../api/ibnet-api.js";
import { updateActivities } from "../../service/activity-updater.js";

const ACTIVITY_1: Activity = {
    rv: 0,
    id: "id1",
    change_time: new Date(),
    deleted: undefined,
    start_time: new Date(),
    icebreaker_id: "",
    type: ""
};

const ACTIVITY_1_1: Activity = { ...ACTIVITY_1, ...{ rv: 1, text_compilation: "foo" } };

const ACTIVITY_1_1_DELETED: Deleted = {
    id: "id1",
    deleted: true
};

async function mockApiResponseAndUpdate(response: Response<Activity>): Promise<void> {
    jest.spyOn(IbnetApi.prototype, "getActivities").mockImplementation((from: number, to: number) =>
        Promise.resolve(response)
    );

    await updateActivities(new IbnetApi("", ""), 0, 1);
}

describe(
    "activity-updater",
    dbTestBase((db: DTDatabase) => {
        test("update empty", async () => {
            await assertActivityCount(db, 0);
            await mockApiResponseAndUpdate([]);
            await assertActivityCount(db, 0);
        });

        test("update one new", async () => {
            await assertActivityCount(db, 0);
            await mockApiResponseAndUpdate([ACTIVITY_1]);
            await assertActivityCount(db, 1);
        });

        test("update one then update it", async () => {
            await assertActivityCount(db, 0);
            await mockApiResponseAndUpdate([ACTIVITY_1]);
            await assertActivityCount(db, 1);

            await mockApiResponseAndUpdate([ACTIVITY_1_1]);
            await assertActivityCount(db, 1);
        });

        test("update one then delete", async () => {
            await assertActivityCount(db, 0);
            await mockApiResponseAndUpdate([ACTIVITY_1]);
            await assertActivityCount(db, 1);

            await mockApiResponseAndUpdate([ACTIVITY_1_1_DELETED]);
            await assertActivityCount(db, 1, 1);
        });
    })
);
