import {DTDatabase} from "@digitraffic/common/database/database";
import {createMaintenanceTrackingMessageHash, saveMaintenanceTrackingObservationData} from "../../lib/service/maintenance-tracking";
import {createObservationsDbDatas, dbTestBase, findAllObservations, truncate} from "../db-testutil";
import {assertObservationData, getTrackingJsonWith3Observations} from "../testdata";

describe('maintenance-tracking', dbTestBase((db: DTDatabase) => {

    beforeEach(() => truncate(db));

    test('saveMaintenanceTrackingObservationData', async () => {
        const json = getTrackingJsonWith3Observations('1', '1');
        const data = createObservationsDbDatas(json);
        await saveMaintenanceTrackingObservationData(data);

        const fetchedObservations = await findAllObservations(db);
        expect(fetchedObservations.length).toBe(3);
        assertObservationData(data, fetchedObservations);
    });

    test('saveMaintenanceTrackingObservationData should succeed for two different messages', async () => {
        const json1 = getTrackingJsonWith3Observations('1', '456');
        const json2 = getTrackingJsonWith3Observations('2', '654');
        await saveMaintenanceTrackingObservationData(createObservationsDbDatas(json1));
        await saveMaintenanceTrackingObservationData(createObservationsDbDatas(json2));

        const fetchedTrackings = await findAllObservations(db);
        expect(fetchedTrackings.length).toBe(6);
    });

    test('saveMaintenanceTrackingObservationData should ony save once for same content and different message id', async () => {
        const json1 = getTrackingJsonWith3Observations('1', '1');
        const json2 = getTrackingJsonWith3Observations('2', '1');

        await saveMaintenanceTrackingObservationData(createObservationsDbDatas(json1));
        await saveMaintenanceTrackingObservationData(createObservationsDbDatas(json2));

        const fetchedTrackings = await findAllObservations(db);
        expect(fetchedTrackings.length).toBe(3);
    });

    test('saveMaintenanceTrackingObservationData with two equal observations and one different should ony different be saved from second message', async () => {
        const json1 = getTrackingJsonWith3Observations('1', '1');
        const json2 = getTrackingJsonWith3Observations('2', '1')
            .replace('[293358, 6889073]', '[293358, 6889074]');

        await saveMaintenanceTrackingObservationData(createObservationsDbDatas(json1));
        await saveMaintenanceTrackingObservationData(createObservationsDbDatas(json2));

        const fetchedTrackings = await findAllObservations(db);
        expect(fetchedTrackings.length).toBe(4);
    });

    test('createMaintenanceTrackingMessageHash should equals for same message but different viestintunniste id', () => {
        const h1 = createMaintenanceTrackingMessageHash(getTrackingJsonWith3Observations('1', '1'));
        const h2 = createMaintenanceTrackingMessageHash(getTrackingJsonWith3Observations('2', '1'));
        // Assert has is same for same json with different viestitunniste
        expect(h1).toBe(h2);
    });

    test('createMaintenanceTrackingMessageHash should differ for different message', () => {
        const h1 = createMaintenanceTrackingMessageHash(getTrackingJsonWith3Observations('1', '123'));
        const h2 = createMaintenanceTrackingMessageHash(getTrackingJsonWith3Observations('1', '321'));
        // Assert has is not same for same json with different data content excluding viestitunniste
        expect(h1).not.toBe(h2);
    });

    test('createObservationHash should equals for same message', () => {
        const tracking = JSON.parse(getTrackingJsonWith3Observations('1', '1'));
        expect(tracking.havainnot.length).toBe(3);
        const observation = tracking.havainnot[0].havainto;
        const h1 = createMaintenanceTrackingMessageHash(JSON.stringify(observation));
        const h2 = createMaintenanceTrackingMessageHash(JSON.stringify(observation));
        // Assert has is same for same json with different viestitunniste
        expect(h1).toBe(h2);
    });

    test('createObservationHash should differ for different message', () => {
        const tracking = JSON.parse(getTrackingJsonWith3Observations('1', '1'));
        expect(tracking.havainnot.length).toBe(3);
        const observation1 = tracking.havainnot[0].havainto;
        const observation2 = tracking.havainnot[1].havainto;
        const h1 = createMaintenanceTrackingMessageHash(JSON.stringify(observation1));
        const h2 = createMaintenanceTrackingMessageHash(JSON.stringify(observation2));
        // Assert has is same for same json with different viestitunniste
        expect(h1).not.toBe(h2);
    });

    test('getTrackingJsonWith3Observations works with viestintunniste and tyokone id', () => {
        expect(getTrackingJsonWith3Observations('1', '1')).toBe(getTrackingJsonWith3Observations('1', '1'));
        expect(getTrackingJsonWith3Observations('1', '1')).not.toBe(getTrackingJsonWith3Observations('2', '1'));
        expect(getTrackingJsonWith3Observations('1', '123')).toBe(getTrackingJsonWith3Observations('1', '123'));
        expect(getTrackingJsonWith3Observations('1', '123')).not.toBe(getTrackingJsonWith3Observations('1', '321'));
    });
}));
