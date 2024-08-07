import {
    dbTestBase,
    findAllTrackings,
    getDomain,
    insertDbDomaindContract,
    insertDomain,
    truncate
} from "../db-testutil.js";
import { type DTDatabase } from "@digitraffic/common/dist/database/database";
import { add } from "date-fns/add";
import * as DataDb from "../../dao/data.js";
import { type DbMaintenanceTracking, type DbNumberId, type DbWorkMachine } from "../../model/db-data.js";
import * as TestUtils from "../testutil.js";
import { type Point } from "geojson";
import {
    CONTRACT_ID,
    DOMAIN_1,
    HARJA_BRUSHING,
    HARJA_PAVING,
    POINT_START,
    SOURCE_1,
    VEHICLE_TYPE
} from "../testconstants.js";
import * as AutoriUtils from "../../service/autori-utils.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

let WORKMACHINE_ID: DbNumberId;
const CONTRACT = TestUtils.createDbDomainContract("contract-1", DOMAIN_1);
const TASKS = [HARJA_BRUSHING, HARJA_PAVING];

describe(
    "db-data-test",
    dbTestBase((db: DTDatabase) => {
        afterEach(async () => {
            await truncate(db);
        });

        async function initData(): Promise<void> {
            await truncate(db);
            await insertDomain(db, DOMAIN_1, SOURCE_1);
            await insertDbDomaindContract(db, CONTRACT);
            const workMachine: DbWorkMachine = AutoriUtils.createDbWorkMachine(
                CONTRACT_ID,
                DOMAIN_1,
                VEHICLE_TYPE
            );
            WORKMACHINE_ID = await db.tx((tx) => {
                return DataDb.upsertWorkMachine(tx, workMachine);
            });
            logger.debug(`Saved workMachine: ${JSON.stringify(WORKMACHINE_ID)}`);
        }

        test("findLatestNotFinishedTrackingForWorkMachine", async () => {
            await initData();
            const startTime = TestUtils.dateInPastMinutes(5);
            const endTimeOlder = TestUtils.addMinutes(startTime, 1);
            const endTime = add(new Date(), { minutes: 2 });
            const lastPoint: Point = TestUtils.createGeoJSONPoint(POINT_START);

            const trackingOlder: DbMaintenanceTracking = TestUtils.createDbMaintenanceTracking(
                CONTRACT,
                WORKMACHINE_ID.id,
                startTime,
                endTimeOlder,
                TASKS,
                lastPoint,
                lastPoint
            );
            const tracking: DbMaintenanceTracking = TestUtils.createDbMaintenanceTracking(
                CONTRACT,
                WORKMACHINE_ID.id,
                startTime,
                endTime,
                TASKS,
                lastPoint,
                lastPoint
            );

            await db.tx((tx) => {
                return DataDb.upsertMaintenanceTrackings(tx, [tracking, trackingOlder]);
            });

            const latest = await DataDb.findLatestNotFinishedTrackingForWorkMachine(
                db,
                CONTRACT.domain,
                WORKMACHINE_ID.id
            );

            expect(latest).toBeTruthy();
            expect(latest?.end_time).toEqual(endTime);
        });

        test("findLatestNotFinishedTrackingForWorkMachine when also finished in db", async () => {
            await initData();
            const startTime = TestUtils.dateInPastMinutes(5);
            const endTimeOlder = TestUtils.addMinutes(startTime, 1);
            const endTime = add(startTime, { minutes: 2 });
            const lastPoint: Point = TestUtils.createGeoJSONPoint(POINT_START);

            const trackingOlder: DbMaintenanceTracking = TestUtils.createDbMaintenanceTracking(
                CONTRACT,
                WORKMACHINE_ID.id,
                startTime,
                endTimeOlder,
                TASKS,
                lastPoint,
                lastPoint
            );
            const trackingFinished: DbMaintenanceTracking = TestUtils.createDbMaintenanceTracking(
                CONTRACT,
                WORKMACHINE_ID.id,
                startTime,
                endTime,
                TASKS,
                lastPoint,
                lastPoint
            );
            trackingFinished.finished = true;

            await db.tx((tx) => {
                return DataDb.upsertMaintenanceTrackings(tx, [trackingFinished, trackingOlder]);
            });

            const latest = await DataDb.findLatestNotFinishedTrackingForWorkMachine(
                db,
                CONTRACT.domain,
                WORKMACHINE_ID.id
            );
            expect(latest).toBeTruthy();
            expect(latest?.end_time).toEqual(endTimeOlder);
        });

        test("findLatestNotFinishedTrackingForWorkMachine finished not found", async () => {
            await initData();
            const startTime = TestUtils.dateInPastMinutes(5);
            const endTime = add(startTime, { minutes: 2 });
            const lastPoint: Point = TestUtils.createGeoJSONPoint(POINT_START);

            const trackingFinished: DbMaintenanceTracking = TestUtils.createDbMaintenanceTracking(
                CONTRACT,
                WORKMACHINE_ID.id,
                startTime,
                endTime,
                TASKS,
                lastPoint,
                lastPoint
            );
            trackingFinished.finished = true;

            await db.tx((tx) => {
                return DataDb.upsertMaintenanceTrackings(tx, [trackingFinished]);
            });

            const latest = await DataDb.findLatestNotFinishedTrackingForWorkMachine(
                db,
                CONTRACT.domain,
                WORKMACHINE_ID.id
            );
            expect(latest).toBeFalsy();
        });

        test("markMaintenanceTrackingFinished", async () => {
            await initData();
            const tracking1: DbMaintenanceTracking = TestUtils.createDbMaintenanceTracking(
                CONTRACT,
                WORKMACHINE_ID.id,
                TestUtils.dateInPastMinutes(5),
                TestUtils.dateInPastMinutes(1),
                TASKS,
                TestUtils.createGeoJSONPoint(POINT_START),
                TestUtils.createGeoJSONPoint(POINT_START)
            );
            const tracking2: DbMaintenanceTracking = TestUtils.createDbMaintenanceTracking(
                CONTRACT,
                WORKMACHINE_ID.id,
                TestUtils.dateInPastMinutes(5),
                TestUtils.dateInPastMinutes(1),
                TASKS,
                TestUtils.createGeoJSONPoint(POINT_START),
                TestUtils.createGeoJSONPoint(POINT_START)
            );
            const finishedId = await db.tx(async (tx) => {
                const ids = await DataDb.upsertMaintenanceTrackings(tx, [tracking1, tracking2]);
                await DataDb.markMaintenanceTrackingFinished(tx, ids[0]!.id);
                return ids[0]!.id;
            });

            const trackings = await findAllTrackings(db, CONTRACT.domain);

            expect(trackings.length).toEqual(2);
            expect(trackings.find((value) => value.id === finishedId)?.finished).toEqual(true);
            expect(trackings.find((value) => value.id !== finishedId)?.finished).toEqual(false);
        });

        test("upsertDomain", async () => {
            await DataDb.upsertDomain(db, CONTRACT.domain);

            const domain = await getDomain(db, CONTRACT.domain);
            expect(domain.name).toEqual(CONTRACT.domain);
            expect(domain.source).toBeNull();
        });

        test("upsertDomain with source", async () => {
            await DataDb.upsertDomain(db, CONTRACT.domain, CONTRACT.source);

            const domain = await getDomain(db, CONTRACT.domain);
            expect(domain.name).toEqual(CONTRACT.domain);
            expect(domain.source).toEqual(CONTRACT.source);
        });
    })
);
