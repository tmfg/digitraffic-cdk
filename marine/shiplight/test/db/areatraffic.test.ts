import {DTDatabase} from "@digitraffic/common/database/database";
import {dbTestBase, insertAreaTraffic, insertVessel, insertVesselLocation} from "../db-testutil";
import {
    getAreaTraffic,
    SHIP_SPEED_NOT_AVAILABLE,
    SHIP_SPEED_THRESHOLD_KNOTS,
} from "../../lib/db/areatraffic";

const OVER_MINIMUM_SPEED = SHIP_SPEED_THRESHOLD_KNOTS + 1;

describe('db-areatraffic', dbTestBase((db: DTDatabase) => {
    test('getAreaTraffic - empty', async () => {
        const traffic = await getAreaTraffic(db);

        expect(traffic).toHaveLength(0);
    });

    test('getAreaTraffic - one-hit', async () => {
        await insertAreaTrafficAndVessel(1);
        await insertVesselLocation(
            db, 1, Date.now(), 1, OVER_MINIMUM_SPEED,
        );

        const traffic = await getAreaTraffic(db);

        expect(traffic).toHaveLength(1);
    });

    test('getAreaTraffic - two ships', async () => {
        await insertAreaTraffic(
            db, 1, 'testi1', 10, "POLYGON((0 0, 10 0, 10 10, 0 10, 0 0))",
        );
        await insertVessel(db, 1);
        await insertVessel(db, 2);
        await insertVesselLocation(
            db, 1, Date.now(), 1, OVER_MINIMUM_SPEED,
        );
        await insertVesselLocation(
            db, 2, Date.now(), 1, OVER_MINIMUM_SPEED,
        );

        const traffic = await getAreaTraffic(db);

        // only return one area!
        expect(traffic).toHaveLength(1);
    });

    test('getAreaTraffic - speed is equal to threshold - no traffic', async () => {
        await insertAreaTrafficAndVessel(1);
        await insertVesselLocation(
            db, 1, Date.now(), 1, SHIP_SPEED_THRESHOLD_KNOTS,
        );

        const traffic = await getAreaTraffic(db);

        expect(traffic).toHaveLength(0);
    });

    test('getAreaTraffic - speed is not available - no traffic', async () => {
        await insertAreaTrafficAndVessel(1);
        await insertVesselLocation(
            db, 1, Date.now(), 1, SHIP_SPEED_NOT_AVAILABLE,
        );

        const traffic = await getAreaTraffic(db);

        expect(traffic).toHaveLength(0);
    });

    test('getAreaTraffic - speed is greater than threshold - traffic detected', async () => {
        await insertAreaTrafficAndVessel(1);
        await insertVesselLocation(
            db, 1, Date.now(), 1, SHIP_SPEED_THRESHOLD_KNOTS + 1,
        );

        const traffic = await getAreaTraffic(db);

        expect(traffic).toHaveLength(1);
    });

    test('getAreaTraffic - not in the area', async () => {
        await insertAreaTrafficAndVessel(1);
        await insertVesselLocation(
            db, 1, Date.now(), -1, OVER_MINIMUM_SPEED,
        );

        const traffic = await getAreaTraffic(db);

        expect(traffic).toHaveLength(0);
    });

    test('getAreaTraffic - timestamp not in window', async () => {
        await insertAreaTrafficAndVessel(1);
        // timestamp is not in the 2 minute window
        await insertVesselLocation(
            db, 1, Date.now() - 2*60*1000, -1, OVER_MINIMUM_SPEED,
        );

        const traffic = await getAreaTraffic(db);

        expect(traffic).toHaveLength(0);
    });

    async function insertAreaTrafficAndVessel(mmsi: number) {
        await insertAreaTraffic(
            db, mmsi, 'testi1', 10, "POLYGON((0 0, 10 0, 10 10, 0 10, 0 0))",
        );
        await insertVessel(db, mmsi);
    }

}));
