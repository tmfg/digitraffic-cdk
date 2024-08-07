import { type DTDatabase } from "@digitraffic/common/dist/database/database";
import * as LastUpdatedDb from "@digitraffic/common/dist/database/last-updated";
import { Asserter } from "@digitraffic/common/dist/test/asserter";
import { getRandomInteger } from "@digitraffic/common/dist/test/testutils";
import { fail } from "assert";
import { type Position } from "geojson";
import { sub } from "date-fns/sub";
import { PaikanninApi } from "../../api/paikannin.js";
import { PAIKANNIN_MAX_DISTANCE_BETWEEN_TRACKINGS_M } from "../../constants.js";
import * as DataDb from "../../dao/data.js";
import {
    type DbDomainContract,
    type DbDomainTaskMapping,
    type DbMaintenanceTracking
} from "../../model/db-data.js";
import {
    type ApiDevice,
    type ApiIoChannel,
    type ApiWorkeventDevice
} from "../../model/paikannin-api-data.js";
import { UNKNOWN_TASK_NAME } from "../../model/tracking-save-result.js";
import { PaikanninUpdate } from "../../service/paikannin-update.js";
import { getTrackingEndPoint, getTrackingStartPoint } from "../../service/utils.js";
import {
    dbTestBase,
    findAllTrackings,
    getDomaindContract,
    insertDbDomaindContract,
    insertDomain,
    insertDomaindTaskMapping,
    truncate
} from "../db-testutil.js";
import {
    DOMAIN_1,
    HARJA_BRUSHING,
    HARJA_PAVING,
    PAIKANNIN_OPERATION_BRUSHING,
    PAIKANNIN_OPERATION_PAVING,
    PAIKANNIN_OPERATION_SALTING,
    POINT_START
} from "../testconstants.js";
import {
    createApiRouteDataForEveryMinute,
    createDbDomainContract,
    createLineString,
    createLineStringGeometry,
    createZigZagCoordinates,
    getRandompId
} from "../testutil.js";
import { jest } from "@jest/globals";

const paikanninUpdateService = createPaikanninUpdateService();

function createPaikanninUpdateService(): PaikanninUpdate {
    return new PaikanninUpdate(PaikanninApi.prototype);
}

describe(
    "paikannin-update-service-test",
    dbTestBase((db: DTDatabase) => {
        beforeEach(async () => {
            await truncate(db);
        });

        afterEach(async () => {
            await truncate(db);
        });

        test("upsertContractForDomain", async () => {
            await insertDomain(db, DOMAIN_1);

            await paikanninUpdateService.upsertContractForDomain(DOMAIN_1);

            const contract: DbDomainContract = await getDomaindContract(db, DOMAIN_1, DOMAIN_1);
            expect(contract.domain).toEqual(DOMAIN_1);
            expect(contract.contract).toEqual(DOMAIN_1);
            expect(contract.source).toBeNull();
            expect(contract.name).toEqual(DOMAIN_1);
            expect(contract.start_date).toBeNull();
            expect(contract.end_date).toBeNull();
            expect(contract.data_last_updated).toBeNull();
        });

        test("updateTaskMappingsForDomain", async () => {
            await insertDomain(db, DOMAIN_1);

            const ioChannels1: ApiIoChannel[] = [
                createApiIoChannel(PAIKANNIN_OPERATION_SALTING.name),
                createApiIoChannel(PAIKANNIN_OPERATION_BRUSHING.name)
            ];
            const device1: ApiDevice = createDevice(ioChannels1);
            const ioChannels2: ApiIoChannel[] = [
                createApiIoChannel(PAIKANNIN_OPERATION_SALTING.name),
                createApiIoChannel(PAIKANNIN_OPERATION_PAVING.name)
            ];
            const device2: ApiDevice = createDevice(ioChannels2);
            mockGetDevicesApiResponse([device1, device2]);

            await paikanninUpdateService.updateTaskMappingsForDomain(DOMAIN_1);

            const mappings: DbDomainTaskMapping[] = await DataDb.getTaskMappings(db, DOMAIN_1);
            expect(mappings.length).toEqual(3);

            const operationNames: string[] = mappings.map((value) => value.original_id);
            expect(operationNames.includes(PAIKANNIN_OPERATION_SALTING.name)).toEqual(true);
            expect(operationNames.includes(PAIKANNIN_OPERATION_BRUSHING.name)).toEqual(true);
            expect(operationNames.includes(PAIKANNIN_OPERATION_PAVING.name)).toEqual(true);
            mappings.forEach((value) => expect(value.ignore).toEqual(true));
            mappings.forEach((value) => expect(value.name).toEqual(UNKNOWN_TASK_NAME));
        });

        test("updateTrackings", async () => {
            await insertDomain(db, DOMAIN_1);
            await insertDbDomaindContract(db, createDbDomainContract(DOMAIN_1, DOMAIN_1));

            await insertDomaindTaskMapping(
                db,
                HARJA_BRUSHING,
                PAIKANNIN_OPERATION_BRUSHING.name,
                DOMAIN_1,
                false
            );
            await insertDomaindTaskMapping(
                db,
                HARJA_PAVING,
                PAIKANNIN_OPERATION_PAVING.name,
                DOMAIN_1,
                false
            );

            // Create two routes, 10 and 0 minutes old
            const past10 = sub(new Date(), { minutes: 10 });
            const past0 = new Date();
            const route2d: ApiWorkeventDevice = createApiRouteDataForEveryMinute(
                1,
                past10,
                createLineStringGeometry(10, 200),
                [PAIKANNIN_OPERATION_BRUSHING]
            );
            const route1d: ApiWorkeventDevice = createApiRouteDataForEveryMinute(
                1,
                past0,
                createLineStringGeometry(9, 200),
                [PAIKANNIN_OPERATION_PAVING]
            );

            mockGetWorkEventsApiResponse([route2d]);
            await paikanninUpdateService.updateTrackingsForDomain(DOMAIN_1);
            jest.clearAllMocks(); // ??

            mockGetWorkEventsApiResponse([route1d]);
            await paikanninUpdateService.updateTrackingsForDomain(DOMAIN_1);

            const trackings = await findAllTrackings(db, DOMAIN_1);

            expect(trackings.length).toEqual(2);
            expect(trackings[0]?.end_time).toEqual(past10);
            expect(trackings[1]?.end_time).toEqual(past0);

            expect(trackings[0]?.geometry.coordinates.length).toEqual(10);
            expect(trackings[1]?.geometry.coordinates.length).toEqual(9);

            const checked = await LastUpdatedDb.getLastUpdatedWithSubtype(
                db,
                LastUpdatedDb.DataType.MAINTENANCE_TRACKING_DATA_CHECKED,
                DOMAIN_1
            );

            expect(checked).toBeTruthy();

            if (checked) {
                Asserter.assertToBeCloseTo(checked.getTime(), past0.getTime(), 900);
            } else {
                fail("checked was null");
            }
        });

        test("updateTrackings invalid linestring", async () => {
            await insertDomain(db, DOMAIN_1);
            await insertDbDomaindContract(db, createDbDomainContract(DOMAIN_1, DOMAIN_1));

            await insertDomaindTaskMapping(
                db,
                HARJA_BRUSHING,
                PAIKANNIN_OPERATION_BRUSHING.name,
                DOMAIN_1,
                false
            );
            await insertDomaindTaskMapping(
                db,
                HARJA_PAVING,
                PAIKANNIN_OPERATION_PAVING.name,
                DOMAIN_1,
                false
            );

            // Create one route with two equal points
            const route: ApiWorkeventDevice = createApiRouteDataForEveryMinute(
                1,
                new Date(),
                createLineString([POINT_START, POINT_START]),
                [PAIKANNIN_OPERATION_BRUSHING]
            );

            mockGetWorkEventsApiResponse([route]);
            await paikanninUpdateService.updateTrackingsForDomain(DOMAIN_1);

            const trackings = await findAllTrackings(db, DOMAIN_1);

            expect(trackings.length).toEqual(1);
            // As source linestring is two equal point's -> it's invalid and it should be saved as point
            expect(trackings[0]?.geometry).toBeTruthy();
            expect(trackings[0]?.geometry).toEqual(trackings[0]?.last_point);

            Asserter.assertToBeCloseTo(trackings[0]?.last_point.coordinates[0]!, POINT_START[0]!, 0.000001);
            Asserter.assertToBeCloseTo(trackings[0]?.last_point.coordinates[1]!, POINT_START[1]!, 0.000001);
            expect(trackings[0]?.last_point.coordinates[2]).toEqual(0);
        });

        test("updateTrackings and split on big distance between points", async () => {
            await insertDomain(db, DOMAIN_1);
            await insertDbDomaindContract(db, createDbDomainContract(DOMAIN_1, DOMAIN_1));

            await insertDomaindTaskMapping(
                db,
                HARJA_BRUSHING,
                PAIKANNIN_OPERATION_BRUSHING.name,
                DOMAIN_1,
                false
            );

            const ln = createLineStringGeometry(22, PAIKANNIN_MAX_DISTANCE_BETWEEN_TRACKINGS_M - 10);
            // remove two elements from the middle so there will be over PAIKANNIN_MAX_DISTANCE_BETWEEN_TRACKINGS_KM jump
            // in the middle of coordinates -> should be divided in two distinct trackings
            ln.coordinates.splice(10, 2);

            // Create one route and big jump between routes, 10 and 0 minutes old
            const end = new Date();
            const route: ApiWorkeventDevice = createApiRouteDataForEveryMinute(1, end, ln, [
                PAIKANNIN_OPERATION_BRUSHING
            ]);

            mockGetWorkEventsApiResponse([route]);
            await paikanninUpdateService.updateTrackingsForDomain(DOMAIN_1);
            jest.restoreAllMocks();

            const trackings = await findAllTrackings(db, DOMAIN_1);

            expect(trackings.length).toEqual(2);
            expect(trackings[0]?.end_time).toEqual(sub(end, { minutes: 10 }));
            expect(trackings[1]?.end_time).toEqual(end);

            expect(trackings[0]?.geometry.coordinates.length).toEqual(10);
            expect(trackings[1]?.geometry.coordinates.length).toEqual(10);
        });

        test("updateTrackings and continue previous", async () => {
            await insertDomain(db, DOMAIN_1);
            await insertDbDomaindContract(db, createDbDomainContract(DOMAIN_1, DOMAIN_1));

            await insertDomaindTaskMapping(
                db,
                HARJA_BRUSHING,
                PAIKANNIN_OPERATION_BRUSHING.name,
                DOMAIN_1,
                false
            );

            const coords = createZigZagCoordinates(20, PAIKANNIN_MAX_DISTANCE_BETWEEN_TRACKINGS_M - 10);
            const coords1 = coords.slice(0, 10);
            const coords2 = coords.slice(10);

            // Create two routes of one linear work
            const end2 = new Date();
            const end1 = sub(end2, { minutes: 10 });

            const route1: ApiWorkeventDevice = createApiRouteDataForEveryMinute(
                1,
                end1,
                createLineString(coords1),
                [PAIKANNIN_OPERATION_BRUSHING]
            );
            const route2: ApiWorkeventDevice = createApiRouteDataForEveryMinute(
                1,
                end2,
                createLineString(coords2),
                [PAIKANNIN_OPERATION_BRUSHING]
            );

            mockGetWorkEventsApiResponse([route1]);
            await paikanninUpdateService.updateTrackingsForDomain(DOMAIN_1);
            jest.restoreAllMocks();
            mockGetWorkEventsApiResponse([route2]);
            await paikanninUpdateService.updateTrackingsForDomain(DOMAIN_1);

            const trackings: DbMaintenanceTracking[] = await findAllTrackings(db, DOMAIN_1);

            expect(trackings.length).toEqual(2);
            // First tracking's end is extended to next tracking start
            expect(trackings[0]?.end_time).toEqual(trackings[1]?.start_time);
            expect(trackings[1]?.end_time).toEqual(end2);

            expect(trackings[0]?.id).toEqual(trackings[1]?.previous_tracking_id);

            const prevEnd: Position = trackings[0]!.last_point.coordinates;
            const prevLineStringEnd: Position = getTrackingEndPoint(trackings[0]!);
            const nextStart: Position = getTrackingStartPoint(trackings[1]!);

            // Check marked end poind is same as next start as it's extending previous one
            expect(prevEnd[0]).toEqual(nextStart[0]);
            expect(prevEnd[1]).toEqual(nextStart[1]);
            expect(prevEnd[2]).toEqual(nextStart[2]);
            // Check that linestring end poind is also the same as next start
            expect(prevLineStringEnd[0]).toEqual(nextStart[0]);
            expect(prevLineStringEnd[1]).toEqual(nextStart[1]);
            expect(prevLineStringEnd[2]).toEqual(nextStart[2]);
        });

        function mockGetDevicesApiResponse(response: ApiDevice[]): void {
            jest.spyOn(PaikanninApi.prototype, "getDevices").mockReturnValueOnce(Promise.resolve(response));
        }

        function mockGetWorkEventsApiResponse(response: ApiWorkeventDevice[]): void {
            jest.spyOn(PaikanninApi.prototype, "getWorkEvents").mockReturnValueOnce(
                Promise.resolve(response)
            );
        }

        function createDevice(ioChannels: ApiIoChannel[]): ApiDevice {
            return {
                id: getRandompId(),
                description: "Foo",
                ioChannels: ioChannels
            };
        }

        function createApiIoChannel(name: string): ApiIoChannel {
            return {
                id: getRandomInteger(1, 10000),
                name: name,
                enabled: true
            };
        }
    })
);
