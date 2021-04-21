import * as MaintenanceTrackingDB from "../../../lib/db/db-maintenance-tracking";
import {DbMaintenanceTrackingData, Status} from "../../../lib/db/db-maintenance-tracking";
import * as pgPromise from "pg-promise";
import {createHash} from "../../../lib/service/maintenance-tracking";
import {assertData, getRandompId, getTrackingJson} from "../testdata";
import {dbTestBase, findAllTrackings} from "../db-testutil";

describe('db-maintenance-tracking - inserts', dbTestBase((db: pgPromise.IDatabase<any, any>) => {

    test('insertMaintenanceTrackingData', async () => {

        const maintenanceTrackingDataJson = getTrackingJson(getRandompId(), getRandompId());
        const dbMaintenanceTrackingData = createData(maintenanceTrackingDataJson);

        await MaintenanceTrackingDB.insertMaintenanceTrackingData(db, dbMaintenanceTrackingData);

        const fetchedTrackings = await findAllTrackings(db);
        expect(fetchedTrackings.length).toBe(1);

        const saved = fetchedTrackings[0];
        assertData(saved, maintenanceTrackingDataJson);
    });

    test('insertMaintenanceTrackingData multiple machines', async () => {

        const maintenanceTrackingDataJson1 = getTrackingJson(getRandompId(), '1');
        const maintenanceTrackingDataJson2 = getTrackingJson(getRandompId(), '2');

        await MaintenanceTrackingDB.insertMaintenanceTrackingData(db, createData(maintenanceTrackingDataJson1));
        await MaintenanceTrackingDB.insertMaintenanceTrackingData(db, createData(maintenanceTrackingDataJson2));

        const fetchedTrackings = await findAllTrackings(db);
        expect(fetchedTrackings.length).toBe(2);
    });

    test('insertMaintenanceTrackingData with same hash should fail', async () => {

        const json = getTrackingJson(getRandompId(), getRandompId());
        const dbMaintenanceTrackingData1 = createData(json);
        // Different data, same hash
        const dbMaintenanceTrackingData2: DbMaintenanceTrackingData = {
            json: getTrackingJson(getRandompId(), getRandompId()),
            status: Status.UNHANDLED,
            hash: dbMaintenanceTrackingData1.hash,
            sendingTime: new Date()
        };

        await MaintenanceTrackingDB.insertMaintenanceTrackingData(db, dbMaintenanceTrackingData1);
        let failure = false;
        try {
            await MaintenanceTrackingDB.insertMaintenanceTrackingData(db, dbMaintenanceTrackingData2);
        } catch (error) {
            // Expect error: duplicate key value violates unique constraint "maintenance_tracking_data_hash_ui"
            failure = true;
        }
        expect(failure).toBe(true);

        const fetchedTrackings = await findAllTrackings(db);
        expect(fetchedTrackings.length).toBe(1);

        const saved = fetchedTrackings[0];
        assertData(saved, json);
    });

    function createData(json : string) : DbMaintenanceTrackingData {
        return {
            json: json,
            status: Status.UNHANDLED,
            hash: createHash(json),
            sendingTime: new Date()
        };
    }

}));
