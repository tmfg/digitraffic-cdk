import * as MaintenanceTrackingDB from "../../lib/db/maintenance-tracking-db";
import * as pgPromise from "pg-promise";
import {createObservationsDbDatas, dbTestBase, findAllObservations} from "../db-testutil";
import {assertObservationData, getRandompId, getTrackingJsonWith3Observations} from "../testdata";

describe('db-maintenance-tracking - inserts', dbTestBase((db: pgPromise.IDatabase<any, any>) => {

    test('insertMaintenanceTrackingData', async () => {

        const maintenanceTrackingDataJson = getTrackingJsonWith3Observations(getRandompId(), getRandompId());
        const createdObservations = createObservationsDbDatas(maintenanceTrackingDataJson);

        await MaintenanceTrackingDB.insertMaintenanceTrackingObservationData(db, createdObservations);

        const fetchedObservations = await findAllObservations(db);
        expect(fetchedObservations.length).toBe(3);

        assertObservationData(createdObservations, fetchedObservations);
    });

    test('insertMaintenanceTrackingData multiple machines', async () => {

        const maintenanceTrackingDataJson1 = getTrackingJsonWith3Observations(getRandompId(), '1');
        const maintenanceTrackingDataJson2 = getTrackingJsonWith3Observations(getRandompId(), '2');

        const createdObservations1 = createObservationsDbDatas(maintenanceTrackingDataJson1);
        const createdObservations2 = createObservationsDbDatas(maintenanceTrackingDataJson2);

        await MaintenanceTrackingDB.insertMaintenanceTrackingObservationData(db, createdObservations1);
        await MaintenanceTrackingDB.insertMaintenanceTrackingObservationData(db, createdObservations2);

        const fetchedObservations = await findAllObservations(db);
        expect(fetchedObservations.length).toBe(6);
    });

    test('insertMaintenanceTrackingData with same hash should not be duplicated in db', async () => {

        const json = getTrackingJsonWith3Observations(getRandompId(), getRandompId());
        const observationData = createObservationsDbDatas(json);

        await MaintenanceTrackingDB.insertMaintenanceTrackingObservationData(db, observationData);
        const fetchedTrackings1 = await findAllObservations(db);
        expect(fetchedTrackings1.length).toBe(3);

        await MaintenanceTrackingDB.insertMaintenanceTrackingObservationData(db, observationData);
        const fetchedTrackings2 = await findAllObservations(db);
        expect(fetchedTrackings2.length).toBe(3);
    });
}));
