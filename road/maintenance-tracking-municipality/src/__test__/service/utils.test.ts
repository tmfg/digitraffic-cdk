import { getRandomInteger } from "@digitraffic/common/dist/test/testutils";
import { type GeoJsonLineString } from "@digitraffic/common/dist/utils/geojson-types";
import { type Position } from "geojson";
import { type DbMaintenanceTracking } from "../../model/db-data.js";
import * as Utils from "../../service/utils.js";
import { createGeoJSONPoint, createLineStringGeometry } from "../testutil.js";

const END_POINT: Position = [27.688935, 62.892983];

describe("UtilsTests", () => {
    test("createHarjaId", () => {
        const id: bigint = Utils.createHarjaId("3330de39-9d1d-457b-a6fd-a800cf6e7f99");
        expect(id).toBe(BigInt("365522198665597071").valueOf());
    });

    test("createHarjaIdNotEqual", () => {
        const id1: bigint = Utils.createHarjaId("3330de39-9d1d-457b-a6fd-a800cf6e7f99");
        const id2: bigint = Utils.createHarjaId("3330de39-9d1d-457b-a6fd-a800cf6e7f98");
        expect(id1).not.toEqual(id2);
    });

    test("countEstimatedSizeOfMessage", () => {
        const message = `{"message":"This is a message"}`;
        const objectMessage = JSON.parse(message) as Record<string, unknown>;
        const messageSize = Utils.countEstimatedSizeOfMessage(message);
        const objectMessageSize = Utils.countEstimatedSizeOfMessage(objectMessage);
        expect(messageSize).toEqual(31);
        expect(messageSize).toEqual(objectMessageSize);
    });

    test("countEstimatedSizeOfMessage null and undefined", () => {
        expect(Utils.countEstimatedSizeOfMessage(null!)).toEqual(0);
        expect(Utils.countEstimatedSizeOfMessage(undefined!)).toEqual(0);
    });

    test("calculateSpeedInKmH", () => {
        expect(Utils.calculateSpeedInKmH(1000, 60 * 60)).toEqual(1);
    });

    test("getTrackingStartPoint with line string", () => {
        const mt = createDbMaintenanceTracking(true);
        const start = Utils.getTrackingStartPoint(mt);
        expect(start[0]).toEqual((mt.geometry as GeoJsonLineString).coordinates[0]![0]!);
        expect(start[1]).toEqual((mt.geometry as GeoJsonLineString).coordinates[0]![1]!);
    });

    test("getTrackingStartPoint without line string", () => {
        const mt = createDbMaintenanceTracking(false);
        const start = Utils.getTrackingStartPoint(mt);
        expect(start[0]).toEqual(END_POINT[0]);
        expect(start[1]).toEqual(END_POINT[1]);
    });
});

function createDbMaintenanceTracking(withLineString: boolean): DbMaintenanceTracking {
    return {
        contract: "",
        domain: "",
        end_time: new Date(),
        finished: false,
        last_point: createGeoJSONPoint(END_POINT),
        geometry: withLineString
            ? createLineStringGeometry(getRandomInteger(5, 10), 100)
            : createGeoJSONPoint(END_POINT),
        message_original_id: "",
        sending_system: "",
        sending_time: new Date(),
        start_time: new Date(),
        tasks: [],
        work_machine_id: 0
    };
}
