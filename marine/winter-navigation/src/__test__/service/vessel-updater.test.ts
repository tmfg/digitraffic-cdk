import { assertVesselCount, dbTestBase } from "../db-testutil.js";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { jest } from "@jest/globals";
import { type Response } from "../../model/apidata.js";
import type { Deleted, Vessel } from "../../model/apidata.js";
import { IbnetApi } from "../../api/ibnet-api.js";

const VESSEL_1: Vessel = {
    rv: 0,
    id: "id1",
    change_time: new Date(),
    deleted: undefined,
    name: "",
    shortcode: ""
};

const VESSEL_1_1: Vessel = { ...VESSEL_1, ...{ rv: 1, text_compilation: "foo" } };

const VESSEL_1_1_DELETED: Deleted = {
    id: "id1",
    deleted: true
};

async function mockApiResponseAndUpdate(response: Response<Vessel>): Promise<void> {
    jest.spyOn(IbnetApi.prototype, "getVessels").mockImplementation((from: number, to: number) =>
        Promise.resolve(response)
    );

    const { updateVessels } = await import("../../service/vessel-updater.js");

    await updateVessels(new IbnetApi("", ""), 0, 1);
}

describe(
    "vessel-updater",
    dbTestBase((db: DTDatabase) => {
        test("update empty", async () => {
            await assertVesselCount(db, 0);
            await mockApiResponseAndUpdate([]);
            await assertVesselCount(db, 0);
        });

        test("update one new", async () => {
            await assertVesselCount(db, 0);
            await mockApiResponseAndUpdate([VESSEL_1]);
            await assertVesselCount(db, 1);
        });

        test("update one then update it", async () => {
            await assertVesselCount(db, 0);
            await mockApiResponseAndUpdate([VESSEL_1]);
            await assertVesselCount(db, 1);

            await mockApiResponseAndUpdate([VESSEL_1_1]);
            await assertVesselCount(db, 1);
        });

        test("update one then delete", async () => {
            await assertVesselCount(db, 0);
            await mockApiResponseAndUpdate([VESSEL_1]);
            await assertVesselCount(db, 1);

            await mockApiResponseAndUpdate([VESSEL_1_1_DELETED]);
            await assertVesselCount(db, 1, 1);
        });
    })
);
