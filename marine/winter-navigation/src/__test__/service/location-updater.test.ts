import { assertLocationCount, dbTestBase } from "../db-testutil.js";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { jest } from "@jest/globals";
import { type Response } from "../../model/apidata.js";
import type { Deleted, Location } from "../../model/apidata.js";
import { IbnetApi } from "../../api/ibnet-api.js";
import { updateLocations } from "../../service/location-updater.js";

const LOCATION_1: Location = {
    name: "name",
    type: "type",
    locode_list: "",
    nationality: "",
    latitude: 12,
    longitude: 13,
    winterport: false,
    rv: 0,
    id: "id1",
    change_time: new Date(),
    deleted: undefined
};

const LOCATION_1_1: Location = {
    ...LOCATION_1,
    ...{
        name: "newName",
        rv: 1
    }
};

const LOCATION_1_DELETED: Deleted = {
    id: "id1",
    deleted: true
};

async function mockApiResponseAndUpdate(response: Response<Location>): Promise<void> {
    jest.spyOn(IbnetApi.prototype, "getLocations").mockImplementation((from: number, to: number) =>
        Promise.resolve(response)
    );

    await updateLocations(new IbnetApi("", ""), 0, 1);
}

describe(
    "location-updater",
    dbTestBase((db: DTDatabase) => {
        test("update empty", async () => {
            await assertLocationCount(db, 0);
            await mockApiResponseAndUpdate([]);
            await assertLocationCount(db, 0);
        });

        test("update one new", async () => {
            await assertLocationCount(db, 0);
            await mockApiResponseAndUpdate([LOCATION_1]);
            await assertLocationCount(db, 1);
        });

        test("update one then update it", async () => {
            await assertLocationCount(db, 0);
            await mockApiResponseAndUpdate([LOCATION_1]);
            await assertLocationCount(db, 1);

            await mockApiResponseAndUpdate([LOCATION_1_1]);
            await assertLocationCount(db, 1);
        });

        test("update one then delete", async () => {
            await assertLocationCount(db, 0);
            await mockApiResponseAndUpdate([LOCATION_1]);
            await assertLocationCount(db, 1);

            await mockApiResponseAndUpdate([LOCATION_1_DELETED]);
            await assertLocationCount(db, 1, 1);
        });
    })
);
