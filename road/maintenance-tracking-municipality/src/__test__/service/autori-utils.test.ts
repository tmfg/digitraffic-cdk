import { Asserter } from "@digitraffic/common/dist/test/asserter";
import { type LineString, type Point } from "geojson";
import { type GeoJsonLineString } from "@digitraffic/common/dist/utils/geojson-types";
import add from "date-fns/add";
import sub from "date-fns/sub";
import {
    AUTORI_MAX_DISTANCE_BETWEEN_TRACKINGS_M,
    AUTORI_MAX_MINUTES_TO_HISTORY,
    AUTORI_MAX_TIME_BETWEEN_TRACKINGS_S
} from "../../constants.js";
import { type ApiContractData, type ApiRouteData } from "../../model/autori-api-data.js";
import {
    type DbDomainTaskMapping,
    type DbMaintenanceTracking,
    type DbWorkMachine
} from "../../model/db-data.js";
import { UNKNOWN_TASK_NAME } from "../../model/tracking-save-result.js";
import * as AutoriUtils from "../../service/autori-utils.js";
import * as utils from "../../service/utils.js";
import * as AutoriTestutils from "../autori-testutil.js";

import {
    AUTORI_OPERATION_BRUSHING,
    AUTORI_OPERATION_PAVING,
    AUTORI_OPERATION_SALTING,
    CONTRACT_ID,
    DOMAIN_1,
    HARJA_BRUSHING,
    HARJA_PAVING,
    HARJA_SALTING,
    POINT_450M_FROM_START,
    POINT_550M_FROM_START,
    POINT_START,
    VEHICLE_TYPE
} from "../testconstants.js";
import {
    createDbDomainContract,
    createFeature,
    createLineString,
    createLineStringGeometries,
    createLineStringGeometry,
    createTaskMapping,
    createZigZagCoordinates
} from "../testutil.js";

describe("autori-utils-service-test", () => {
    test("isExtendingPreviousTracking", () => {
        expect(AutoriUtils.isExtendingPreviousTracking(POINT_START, POINT_450M_FROM_START)).toEqual(true);
        expect(AutoriUtils.isExtendingPreviousTracking(POINT_START, POINT_550M_FROM_START)).toEqual(false);
    });

    test("fixApiRouteData", () => {
        const coords1 = createZigZagCoordinates(10, AUTORI_MAX_DISTANCE_BETWEEN_TRACKINGS_M - 10);
        const coords2 = createZigZagCoordinates(15, AUTORI_MAX_DISTANCE_BETWEEN_TRACKINGS_M - 10);
        const g1 = createLineString(coords1);
        const g2 = createLineString(coords2);
        const route = AutoriTestutils.createApiRouteData(new Date(), [g1, g2]);

        const fixedRoute = AutoriUtils.fixApiRouteDatas([route]);
        expect(fixedRoute.length).toEqual(2);
        expect(fixedRoute[0]?.geography?.features.length).toEqual(1);
        expect(fixedRoute[1]?.geography?.features.length).toEqual(1);
        expect((fixedRoute[0]?.geography?.features[0]?.geometry as LineString).coordinates.length).toEqual(
            10
        );
        expect((fixedRoute[1]?.geography?.features[0]?.geometry as LineString).coordinates.length).toEqual(
            15
        );
    });

    test("fixApiRouteData single", () => {
        const coords1 = createZigZagCoordinates(10, AUTORI_MAX_DISTANCE_BETWEEN_TRACKINGS_M - 10);

        const g1 = createLineString(coords1);

        const route = AutoriTestutils.createApiRouteData(new Date(), [g1]);

        const fixedRoute = AutoriUtils.fixApiRouteDatas([route]);
        expect(fixedRoute.length).toEqual(1);
        expect(fixedRoute[0]?.geography?.features.length).toEqual(1);

        expect((fixedRoute[0]?.geography?.features[0]?.geometry as LineString).coordinates.length).toEqual(
            10
        );
    });

    test("fixApiRouteData empty", () => {
        const fixedRoute = AutoriUtils.fixApiRouteDatas([]);
        expect(fixedRoute.length).toEqual(0);
    });

    test("groupEventsToIndividualGeometries no change", () => {
        const coords = createZigZagCoordinates(20, AUTORI_MAX_DISTANCE_BETWEEN_TRACKINGS_M - 10);
        const f = createFeature(createLineString(coords));

        const groups = AutoriUtils.groupFeaturesToIndividualGeometries(f);
        expect(groups.length).toEqual(1);
        expect((groups[0]?.geometry as LineString).coordinates.length).toEqual(20);
    });

    test("groupEventsToIndividualGeometries split when big jump", () => {
        const ls = createLineStringGeometry(20, AUTORI_MAX_DISTANCE_BETWEEN_TRACKINGS_M - 10);
        ls.coordinates.splice(10, 2); // Delete 2 points to get a long jump in middle of tracking
        const f = createFeature(ls);

        const groups = AutoriUtils.groupFeaturesToIndividualGeometries(f);
        expect(groups.length).toEqual(2);
        expect((groups[0]?.geometry as LineString).coordinates.length).toEqual(10);
        expect((groups[1]?.geometry as LineString).coordinates.length).toEqual(8);
    });

    test("groupEventsToIndividualGeometries split to point", () => {
        const ls = createLineStringGeometry(20, AUTORI_MAX_DISTANCE_BETWEEN_TRACKINGS_M - 10);
        ls.coordinates.splice(1, 2); // After first location a long jump
        const f = createFeature(ls);

        const groups = AutoriUtils.groupFeaturesToIndividualGeometries(f);
        expect(groups.length).toEqual(2);
        expect((groups[0]?.geometry as Point).coordinates.length).toEqual(3); // Just point [x,y,z]
        expect(groups[0]?.geometry.type).toEqual("Point"); // Just point [x,y]
        expect((groups[1]?.geometry as LineString).coordinates.length).toEqual(17);
    });

    test("isOverTimeLimit", () => {
        const now = new Date();
        const insideLimit = add(now, { seconds: AUTORI_MAX_TIME_BETWEEN_TRACKINGS_S - 1 });
        const onLimit = add(now, { seconds: AUTORI_MAX_TIME_BETWEEN_TRACKINGS_S });
        const outsideLimit = add(now, { seconds: AUTORI_MAX_TIME_BETWEEN_TRACKINGS_S + 1 });
        expect(AutoriUtils.isOverTimeLimit(now, insideLimit)).toBe(false);
        expect(AutoriUtils.isOverTimeLimit(now, onLimit)).toEqual(false);
        expect(AutoriUtils.isOverTimeLimit(now, outsideLimit)).toBe(true);
    });

    test("isOverTimeLimit in wrong order", () => {
        const previous = new Date();
        const next = sub(previous, { minutes: 1 });
        expect(AutoriUtils.isOverTimeLimit(previous, next)).toEqual(true); //  next before previous
    });

    test("getTasksForOperations", () => {
        const taskMappings = [
            // Map domain operations to harja tasks
            createTaskMapping(DOMAIN_1, HARJA_BRUSHING, AUTORI_OPERATION_BRUSHING, false),
            createTaskMapping(DOMAIN_1, HARJA_PAVING, AUTORI_OPERATION_PAVING, true),
            createTaskMapping(DOMAIN_1, HARJA_SALTING, AUTORI_OPERATION_SALTING, false)
        ];

        const tasks: string[] = AutoriUtils.getTasksForOperations(
            [AUTORI_OPERATION_BRUSHING, AUTORI_OPERATION_PAVING],
            taskMappings
        );

        expect(tasks).toHaveLength(1);
        expect(tasks).toContain(HARJA_BRUSHING);
    });

    test("getTasksForOperations duplicates", () => {
        const taskMappings = [
            // Map domain operations to harja tasks, map two operations to one task
            createTaskMapping(DOMAIN_1, HARJA_BRUSHING, AUTORI_OPERATION_BRUSHING, false),
            createTaskMapping(DOMAIN_1, HARJA_BRUSHING, AUTORI_OPERATION_PAVING, false),
            createTaskMapping(DOMAIN_1, HARJA_SALTING, AUTORI_OPERATION_SALTING, false)
        ];

        const tasks: string[] = AutoriUtils.getTasksForOperations(
            [AUTORI_OPERATION_BRUSHING, AUTORI_OPERATION_PAVING],
            taskMappings
        );

        expect(tasks).toHaveLength(1);
        expect(tasks).toContain(HARJA_BRUSHING);
    });

    test("resolveNextStartTimeForDataFromApi in limits", () => {
        const inLimits = add(new Date(), { minutes: AUTORI_MAX_MINUTES_TO_HISTORY - 1 });
        const contract = createDbDomainContract(CONTRACT_ID, DOMAIN_1, inLimits);
        const resolved = AutoriUtils.resolveNextStartTimeForDataFromApi(contract);
        Asserter.assertToBeCloseTo(resolved.getTime(), inLimits.getTime(), 1000);
    });

    test("resolveNextStartTimeForDataFromApi too far in past", () => {
        const limit = sub(new Date(), { minutes: AUTORI_MAX_MINUTES_TO_HISTORY });
        const tooFar = sub(new Date(), { minutes: AUTORI_MAX_MINUTES_TO_HISTORY + 1 });
        const contract = createDbDomainContract(CONTRACT_ID, DOMAIN_1, tooFar);
        const resolved = AutoriUtils.resolveNextStartTimeForDataFromApi(contract);
        Asserter.assertToBeCloseTo(resolved.getTime(), limit.getTime(), 1000);
    });

    test("createDbDomainContracts", () => {
        const CONTRACT_1 = "contract1";
        const CONTRACT_2 = "contract2";
        const apiContracts: ApiContractData[] = [
            AutoriTestutils.createApiContractData(CONTRACT_1),
            AutoriTestutils.createApiContractData(CONTRACT_2)
        ];
        const contracts = AutoriUtils.createDbDomainContracts(apiContracts, DOMAIN_1);
        expect(contracts).toHaveLength(2);
        expect(contracts.find((c) => c.name === CONTRACT_1)?.contract).toEqual(apiContracts[0]?.id);
        expect(contracts.find((c) => c.name === CONTRACT_2)?.contract).toEqual(apiContracts[1]?.id);
    });

    test("createDbWorkMachine", () => {
        const wm: DbWorkMachine = AutoriUtils.createDbWorkMachine(CONTRACT_ID, DOMAIN_1, VEHICLE_TYPE);
        expect(wm.harjaUrakkaId).toEqual(utils.createHarjaId(CONTRACT_ID));
        expect(wm.harjaId).toEqual(utils.createHarjaId(VEHICLE_TYPE));
        expect(wm.type).toContain(CONTRACT_ID);
        expect(wm.type).toContain(VEHICLE_TYPE);
        expect(wm.type).toContain(DOMAIN_1);
    });

    test("createDbMaintenanceTracking", () => {
        const workMachineId = 1;
        const now = new Date();
        const geometry: LineString = createLineStringGeometry(10, 100);
        const route: ApiRouteData = AutoriTestutils.createApiRouteData(now, [geometry]);
        const dbContract = createDbDomainContract("contract-1", DOMAIN_1);
        const tracking: DbMaintenanceTracking | undefined = AutoriUtils.createDbMaintenanceTracking(
            workMachineId,
            route,
            dbContract,
            [HARJA_BRUSHING, HARJA_SALTING]
        );

        // Expect all geometries to be found
        expect((tracking?.geometry as GeoJsonLineString).coordinates.length).toEqual(
            geometry.coordinates.length
        ); // same as geometries count

        const ls = tracking?.geometry as GeoJsonLineString;
        // @ts-ignore
        expect(ls.coordinates[0][1]).toEqual(geometry.coordinates[0][1]);
        console.info(`Found ${JSON.stringify(ls)}`);
        expect(tracking?.start_time).toEqual(AutoriTestutils.createTrackingStartTimeFromUpdatedTime(now));
        expect(tracking?.end_time).toEqual(AutoriTestutils.createTrackingEndTimeFromUpdatedTime(now));
    });

    test("createDbMaintenanceTracking empty tasks", () => {
        const route: ApiRouteData = AutoriTestutils.createApiRouteData(
            new Date(),
            createLineStringGeometries(2, 5)
        );
        const dbContract = createDbDomainContract("contract-1", DOMAIN_1);
        const tracking: DbMaintenanceTracking | undefined = AutoriUtils.createDbMaintenanceTracking(
            1,
            route,
            dbContract,
            []
        );

        expect(tracking).toBeUndefined();
    });

    test("createDbDomainTaskMappings", () => {
        const operations = [
            AutoriTestutils.createApiOperationData(AUTORI_OPERATION_BRUSHING, DOMAIN_1),
            AutoriTestutils.createApiOperationData(AUTORI_OPERATION_PAVING, DOMAIN_1)
        ];
        const mappings: DbDomainTaskMapping[] = AutoriUtils.createDbDomainTaskMappings(operations, DOMAIN_1);

        expect(mappings.length).toEqual(2);
        mappings.forEach((mapping, index) => {
            expect(mapping.ignore).toEqual(true);
            expect(mapping.domain).toEqual(DOMAIN_1);
            expect(mapping.name).toEqual(UNKNOWN_TASK_NAME);
            expect(mapping.original_id).toEqual(operations[index]?.id);
        });
    });
});
