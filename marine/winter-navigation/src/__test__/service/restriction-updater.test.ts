import { assertRestrictionCount, dbTestBase } from "../db-testutil.js";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { jest } from "@jest/globals";
import { type Response } from "../../model/apidata.js";
import type { Deleted, Restriction } from "../../model/apidata.js";
import { IbnetApi } from "../../api/ibnet-api.js";

const RESTRICTION_1: Restriction = {
    rv: 0,
    id: "id1",
    location_id: "location_1",
    change_time: new Date(),
    deleted: undefined,
    start_time: new Date(),
    text_compilation: ""
};

const RESTRICTION_1_1: Restriction = { ...RESTRICTION_1, ...{ rv: 1, text_compilation: "foo" } };

const RESTRICTION_1_DELETED: Deleted = {
    id: "id1",
    deleted: true
};

async function mockApiResponseAndUpdate(response: Response<Restriction>): Promise<void> {
    jest.spyOn(IbnetApi.prototype, "getRestrictions").mockImplementation((from: number, to: number) =>
        Promise.resolve(response)
    );

    const { updateRestrictions } = await import("../../service/restriction-updater.js");

    await updateRestrictions(new IbnetApi("", ""), 0, 1);
}

describe(
    "restriction-updater",
    dbTestBase((db: DTDatabase) => {
        test("update empty", async () => {
            await assertRestrictionCount(db, 0);
            await mockApiResponseAndUpdate([]);
            await assertRestrictionCount(db, 0);
        });

        test("update one new", async () => {
            await assertRestrictionCount(db, 0);
            await mockApiResponseAndUpdate([RESTRICTION_1]);
            await assertRestrictionCount(db, 1);
        });

        test("update one then update it", async () => {
            await assertRestrictionCount(db, 0);
            await mockApiResponseAndUpdate([RESTRICTION_1]);
            await assertRestrictionCount(db, 1);

            await mockApiResponseAndUpdate([RESTRICTION_1_1]);
            await assertRestrictionCount(db, 1);
        });

        test("update one then delete", async () => {
            await assertRestrictionCount(db, 0);
            await mockApiResponseAndUpdate([RESTRICTION_1]);
            await assertRestrictionCount(db, 1);

            await mockApiResponseAndUpdate([RESTRICTION_1_DELETED]);
            await assertRestrictionCount(db, 1, 1);
        });
    })
);
