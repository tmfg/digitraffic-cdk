import { assertSourceCount, dbTestBase } from "../db-testutil.js";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { jest } from "@jest/globals";
import { type Response } from "../../model/apidata.js";
import type { Deleted, Source } from "../../model/apidata.js";
import { IbnetApi } from "../../api/ibnet-api.js";

const SOURCE_1: Source = {
    rv: 0,
    id: "id1",
    change_time: new Date(),
    deleted: undefined,
    name: "",
    nationality: "",
    type: ""
};

const SOURCE_1_1: Source = { ...SOURCE_1, ...{ rv: 1, text_compilation: "foo" } };

const SOURCE_1_1_DELETED: Deleted = {
    id: "id1",
    deleted: true
};

async function mockApiResponseAndUpdate(response: Response<Source>): Promise<void> {
    jest.spyOn(IbnetApi.prototype, "getSources").mockImplementation((from: number, to: number) =>
        Promise.resolve(response)
    );

    const { updateSources } = await import("../../service/source-updater.js");

    await updateSources(new IbnetApi("", ""), 0, 1);
}

describe(
    "source-updater",
    dbTestBase((db: DTDatabase) => {
        test("update empty", async () => {
            await assertSourceCount(db, 0);
            await mockApiResponseAndUpdate([]);
            await assertSourceCount(db, 0);
        });

        test("update one new", async () => {
            await assertSourceCount(db, 0);
            await mockApiResponseAndUpdate([SOURCE_1]);
            await assertSourceCount(db, 1);
        });

        test("update one then update it", async () => {
            await assertSourceCount(db, 0);
            await mockApiResponseAndUpdate([SOURCE_1]);
            await assertSourceCount(db, 1);

            await mockApiResponseAndUpdate([SOURCE_1_1]);
            await assertSourceCount(db, 1);
        });

        test("update one then delete", async () => {
            await assertSourceCount(db, 0);
            await mockApiResponseAndUpdate([SOURCE_1]);
            await assertSourceCount(db, 1);

            await mockApiResponseAndUpdate([SOURCE_1_1_DELETED]);
            await assertSourceCount(db, 1, 1);
        });
    })
);
