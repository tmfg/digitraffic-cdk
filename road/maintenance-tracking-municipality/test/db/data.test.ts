/* eslint-disable camelcase */
import {dbTestBase, findAllTrackings, getDomain, insertDbDomaindContract, insertDomain, truncate} from "../db-testutil";
import {DTDatabase} from "digitraffic-common/database/database";
import moment from "moment";
import * as DataDb from "../../lib/db/data";
import {DbMaintenanceTracking, DbNumberId, DbWorkMachine} from "../../lib/model/db-data";
import * as TestUtils from "../testutil";
import {Point} from "geojson";
import {CONTRACT_ID, DOMAIN_1, HARJA_BRUSHING, HARJA_PAVING, POINT_START, SOURCE_1, VEHICLE_TYPE} from "../testconstants";
import * as AutoriUtils from "../../lib/service/autori-utils";


let WORKMACHINE_ID : DbNumberId;
const CONTRACT = TestUtils.createDbDomainContract("contract-1", DOMAIN_1);
const TASKS = [HARJA_BRUSHING, HARJA_PAVING];

describe('db-data-test', dbTestBase((db: DTDatabase) => {

    afterEach(async () => {
        await truncate(db);
    });

    async function initData() {
        await truncate(db);
        await insertDomain(db, DOMAIN_1, SOURCE_1);
        await insertDbDomaindContract(db, CONTRACT);
        const workMachine : DbWorkMachine = AutoriUtils.createDbWorkMachine(CONTRACT_ID, DOMAIN_1, VEHICLE_TYPE);
        WORKMACHINE_ID = await db.tx(tx => {
            return DataDb.upsertWorkMachine(tx, workMachine);
        });
        console.info(`Saved workMachine: ${JSON.stringify(WORKMACHINE_ID)}`);
    }

    test('findLatestNotFinishedTrackingForWorkMachine', async () => {
        await initData();
        const startTime = TestUtils.dateInPastMinutes(5);
        const endTimeOlder = TestUtils.addMinutes(startTime, 1);
        const endTime = moment(startTime).add(2, 'minutes').toDate();
        const lastPoint: Point = TestUtils.createGeoJSONPoint(POINT_START);

        const trackingOlder: DbMaintenanceTracking  = TestUtils.createDbMaintenanceTracking(
            CONTRACT, WORKMACHINE_ID.id, startTime, endTimeOlder, TASKS , lastPoint,
        );
        const tracking: DbMaintenanceTracking  = TestUtils.createDbMaintenanceTracking(
            CONTRACT, WORKMACHINE_ID.id, startTime, endTime, TASKS , lastPoint,
        );

        await db.tx(tx => {
            return DataDb.upsertMaintenanceTrackings(tx, [tracking, trackingOlder]);
        });

        const latest = await DataDb.findLatestNotFinishedTrackingForWorkMachine(db, CONTRACT.domain, WORKMACHINE_ID.id);

        expect(latest).toBeTruthy();
        expect(latest?.end_time).toEqual(endTime);
    });

    test('findLatestNotFinishedTrackingForWorkMachine when also finished in db', async () => {
        await initData();
        const startTime = TestUtils.dateInPastMinutes(5);
        const endTimeOlder = TestUtils.addMinutes(startTime, 1);
        const endTime = moment(startTime).add(2, 'minutes').toDate();
        const lastPoint: Point = TestUtils.createGeoJSONPoint(POINT_START);

        const trackingOlder: DbMaintenanceTracking  = TestUtils.createDbMaintenanceTracking(
            CONTRACT, WORKMACHINE_ID.id, startTime, endTimeOlder, TASKS , lastPoint,
        );
        const trackingFinished: DbMaintenanceTracking  = TestUtils.createDbMaintenanceTracking(
            CONTRACT, WORKMACHINE_ID.id, startTime, endTime, TASKS , lastPoint,
        );
        trackingFinished.finished = true;

        await db.tx(tx => {
            return DataDb.upsertMaintenanceTrackings(tx, [trackingFinished, trackingOlder]);
        });

        const latest = await DataDb.findLatestNotFinishedTrackingForWorkMachine(db, CONTRACT.domain, WORKMACHINE_ID.id);
        expect(latest).toBeTruthy();
        expect(latest?.end_time).toEqual(endTimeOlder);
    });

    test('findLatestNotFinishedTrackingForWorkMachine finished not found', async () => {
        await initData();
        const startTime = TestUtils.dateInPastMinutes(5);
        const endTime = moment(startTime).add(2, 'minutes').toDate();
        const lastPoint: Point = TestUtils.createGeoJSONPoint(POINT_START);

        const trackingFinished: DbMaintenanceTracking  = TestUtils.createDbMaintenanceTracking(
            CONTRACT, WORKMACHINE_ID.id, startTime, endTime, TASKS , lastPoint,
        );
        trackingFinished.finished = true;

        await db.tx(tx => {
            return DataDb.upsertMaintenanceTrackings(tx, [trackingFinished]);
        });

        const latest = await DataDb.findLatestNotFinishedTrackingForWorkMachine(db, CONTRACT.domain, WORKMACHINE_ID.id);
        expect(latest).toBeFalsy();
    });

    test('markMaintenanceTrackingFinished', async () => {
        await initData();
        const tracking1: DbMaintenanceTracking  = TestUtils.createDbMaintenanceTracking(
            CONTRACT, WORKMACHINE_ID.id, TestUtils.dateInPastMinutes(5),
            TestUtils.dateInPastMinutes(1), TASKS , TestUtils.createGeoJSONPoint(POINT_START),
        );
        const tracking2: DbMaintenanceTracking  = TestUtils.createDbMaintenanceTracking(
            CONTRACT, WORKMACHINE_ID.id, TestUtils.dateInPastMinutes(5),
            TestUtils.dateInPastMinutes(1), TASKS , TestUtils.createGeoJSONPoint(POINT_START),
        );
        const finishedId = await db.tx(async tx => {
            const ids = await DataDb.upsertMaintenanceTrackings(tx, [tracking1, tracking2]);
            DataDb.markMaintenanceTrackingFinished(tx, ids[0].id);
            return ids[0].id;
        });

        const trackings = await findAllTrackings(db, CONTRACT.domain);

        expect(trackings.length).toEqual(2);
        expect(trackings.find(value => value.id === finishedId)?.finished).toEqual(true);
        expect(trackings.find(value => value.id !== finishedId)?.finished).toEqual(false);
    });


    test('upsertDomain', async () => {
        await DataDb.upsertDomain(db, CONTRACT.domain);

        const domain = await getDomain(db, CONTRACT.domain);
        expect(domain.name).toEqual(CONTRACT.domain);
        expect(domain.source).toBeNull();
    });

    test('upsertDomain with source', async () => {
        await DataDb.upsertDomain(db, CONTRACT.domain, CONTRACT.source);

        const domain = await getDomain(db, CONTRACT.domain);
        expect(domain.name).toEqual(CONTRACT.domain);
        expect(domain.source).toEqual(CONTRACT.source);
    });
}));