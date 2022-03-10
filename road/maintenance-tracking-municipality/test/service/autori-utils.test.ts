/* eslint-disable camelcase */
import moment from "moment";
import * as AutoriUtils from "../../lib/service/autori-utils";

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
    VEHICLE_TYPE,
} from "../testconstants";
import {
    createDbDomainContract,
    createFeature,
    createLineString,
    createLineStringGeometries,
    createLineStringGeometry,
    createTaskMapping,
    createZigZagCoordinates,
} from "../testutil";
import {AUTORI_MAX_DISTANCE_BETWEEN_TRACKINGS_KM, AUTORI_MAX_MINUTES_TO_HISTORY, AUTORI_MAX_TIME_BETWEEN_TRACKINGS_MS} from "../../lib/constants";
import {Asserter} from "digitraffic-common/test/asserter";
import {LineString, Point} from "geojson";
import * as AutoriTestutils from "../autori-testutil";
import {ApiContractData, ApiRouteData} from "../../lib/model/autori-api-data";
import {DbDomainTaskMapping, DbMaintenanceTracking, DbWorkMachine} from "../../lib/model/db-data";
import {UNKNOWN_TASK_NAME} from "../../lib/model/tracking-save-result";
import * as utils from "../../lib/service/utils";

describe('paikannin-utils-service-test', () => {

    test('isExtendingPreviousTracking', () => {
        expect(AutoriUtils.isExtendingPreviousTracking(POINT_START, POINT_450M_FROM_START)).toEqual(true);
        expect(AutoriUtils.isExtendingPreviousTracking(POINT_START, POINT_550M_FROM_START)).toEqual(false);
    });

    test('fixApiRouteData', () => {
        const coords1 = createZigZagCoordinates(10, AUTORI_MAX_DISTANCE_BETWEEN_TRACKINGS_KM-0.01);
        const coords2 = createZigZagCoordinates(15, AUTORI_MAX_DISTANCE_BETWEEN_TRACKINGS_KM-0.01);
        const g1 = createLineString(coords1);
        const g2 = createLineString(coords2);
        const route = AutoriTestutils.createApiRouteData(new Date(), [g1, g2]);

        const fixedRoute = AutoriUtils.fixApiRouteDatas([route]);
        expect(fixedRoute.length).toEqual(2);
        expect(fixedRoute[0].geography?.features.length).toEqual(1);
        expect(fixedRoute[1].geography?.features.length).toEqual(1);
        expect((<LineString>fixedRoute[0].geography?.features[0].geometry).coordinates.length).toEqual(10);
        expect((<LineString>fixedRoute[1].geography?.features[0].geometry).coordinates.length).toEqual(15);
    });

    test('groupEventsToIndividualGeometries no change', () => {
        const coords = createZigZagCoordinates(20, AUTORI_MAX_DISTANCE_BETWEEN_TRACKINGS_KM-0.01);
        const f = createFeature(createLineString(coords));

        const groups = AutoriUtils.groupFeaturesToIndividualGeometries(f);
        expect(groups.length).toEqual(1);
        expect((<LineString>groups[0].geometry).coordinates.length).toEqual(20);
    });

    test('groupEventsToIndividualGeometries split when big jump', () => {
        const ls = createLineStringGeometry(20, AUTORI_MAX_DISTANCE_BETWEEN_TRACKINGS_KM-0.01);
        ls.coordinates.splice(10, 2); // Delete 2 points to get a long jump in middle of tracking
        const f = createFeature(ls);

        const groups = AutoriUtils.groupFeaturesToIndividualGeometries(f);
        expect(groups.length).toEqual(2);
        expect((<LineString>groups[0].geometry).coordinates.length).toEqual(10);
        expect((<LineString>groups[1].geometry).coordinates.length).toEqual(8);
    });

    test('groupEventsToIndividualGeometries split to point', () => {
        const ls = createLineStringGeometry(20, AUTORI_MAX_DISTANCE_BETWEEN_TRACKINGS_KM-0.01);
        ls.coordinates.splice(1, 2); // After first location a long jump
        const f = createFeature(ls);

        const groups = AutoriUtils.groupFeaturesToIndividualGeometries(f);
        expect(groups.length).toEqual(2);
        expect((<Point>groups[0].geometry).coordinates.length).toEqual(2); // Just point [x,y]
        expect(groups[0].geometry.type).toEqual('Point'); // Just point [x,y]
        expect((<LineString>groups[1].geometry).coordinates.length).toEqual(17);
    });

    test('isOverTimeLimit', () => {
        const now = new Date();
        const insideLimit = moment().add(AUTORI_MAX_TIME_BETWEEN_TRACKINGS_MS-1000, 'milliseconds').toDate();
        const outsideLimit = moment().add(AUTORI_MAX_TIME_BETWEEN_TRACKINGS_MS+1000, 'milliseconds').toDate();
        expect(AutoriUtils.isOverTimeLimit(now, insideLimit)).toBe(false);
        expect(AutoriUtils.isOverTimeLimit(now, outsideLimit)).toBe(true);
    });

    test('getTasksForOperations', () => {
        const taskMappings = [
            // Map domain operations to harja tasks
            createTaskMapping(DOMAIN_1, HARJA_BRUSHING, AUTORI_OPERATION_BRUSHING, false),
            createTaskMapping(DOMAIN_1, HARJA_PAVING, AUTORI_OPERATION_PAVING, true),
            createTaskMapping(DOMAIN_1, HARJA_SALTING, AUTORI_OPERATION_SALTING, false),
        ];

        const tasks : string[] = AutoriUtils.getTasksForOperations([AUTORI_OPERATION_BRUSHING, AUTORI_OPERATION_PAVING], taskMappings);

        expect(tasks).toHaveLength(1);
        expect(tasks).toContain(HARJA_BRUSHING);
    });

    test('getTasksForOperations duplicates', () => {
        const taskMappings = [
            // Map domain operations to harja tasks, map two operations to one task
            createTaskMapping(DOMAIN_1, HARJA_BRUSHING, AUTORI_OPERATION_BRUSHING, false),
            createTaskMapping(DOMAIN_1, HARJA_BRUSHING, AUTORI_OPERATION_PAVING, false),
            createTaskMapping(DOMAIN_1, HARJA_SALTING, AUTORI_OPERATION_SALTING, false),
        ];

        const tasks : string[] = AutoriUtils.getTasksForOperations([AUTORI_OPERATION_BRUSHING, AUTORI_OPERATION_PAVING], taskMappings);

        expect(tasks).toHaveLength(1);
        expect(tasks).toContain(HARJA_BRUSHING);
    });

    test('resolveNextStartTimeForDataFromApi in limits', () => {
        const inLimits = moment().subtract(AUTORI_MAX_MINUTES_TO_HISTORY-1, 'minutes').toDate();
        const contract = createDbDomainContract(CONTRACT_ID, DOMAIN_1, inLimits);
        const resolved = AutoriUtils.resolveNextStartTimeForDataFromApi(contract);
        Asserter.assertToBeCloseTo(resolved.getTime(), inLimits.getTime(), 1000);
    });

    test('resolveNextStartTimeForDataFromApi too far in past', () => {
        const limit = moment().subtract(AUTORI_MAX_MINUTES_TO_HISTORY, 'minutes').toDate();
        const tooFar = moment().subtract(AUTORI_MAX_MINUTES_TO_HISTORY+1, 'minutes').toDate();
        const contract = createDbDomainContract(CONTRACT_ID, DOMAIN_1, tooFar);
        const resolved = AutoriUtils.resolveNextStartTimeForDataFromApi(contract);
        Asserter.assertToBeCloseTo(resolved.getTime(), limit.getTime(), 1000);
    });

    test('createDbDomainContracts', () => {
        const CONTRACT_1 = 'contract1';
        const CONTRACT_2 = 'contract2';
        const apiContracts : ApiContractData[] = [AutoriTestutils.createApiContractData(CONTRACT_1), AutoriTestutils.createApiContractData(CONTRACT_2)];
        const contracts = AutoriUtils.createDbDomainContracts(apiContracts, DOMAIN_1);
        expect(contracts).toHaveLength(2);
        expect(contracts.find(c => c.name == CONTRACT_1)?.contract).toEqual(apiContracts[0].id);
        expect(contracts.find(c => c.name == CONTRACT_2)?.contract).toEqual(apiContracts[1].id);
    });

    test('createDbWorkMachine', () => {
        const wm : DbWorkMachine = AutoriUtils.createDbWorkMachine(CONTRACT_ID, DOMAIN_1, VEHICLE_TYPE);
        expect(wm.harjaUrakkaId).toEqual(utils.createHarjaId(CONTRACT_ID));
        expect(wm.harjaId).toEqual(utils.createHarjaId(VEHICLE_TYPE));
        expect(wm.type).toContain(CONTRACT_ID);
        expect(wm.type).toContain(VEHICLE_TYPE);
        expect(wm.type).toContain(DOMAIN_1);
    });


    test('createDbMaintenanceTracking', () => {
        const workMachineId = 1;
        const now = moment().toDate();
        const geometry : LineString = createLineStringGeometry(10,0.1);
        const route : ApiRouteData = AutoriTestutils.createApiRouteData(now, [geometry]);
        const dbContract = createDbDomainContract("contract-1", DOMAIN_1);
        const tracking : DbMaintenanceTracking|null = AutoriUtils.createDbMaintenanceTracking(workMachineId, route, dbContract, [HARJA_BRUSHING, HARJA_SALTING]);

        // Expect all geometries to be found
        expect(tracking?.line_string?.coordinates.length).toEqual(geometry.coordinates.length); // same as geometries count

        const ls = tracking?.line_string;
        expect(ls?.coordinates[0][1]).toEqual(geometry.coordinates[0][1]);
        console.info(`Found ${JSON.stringify(ls)}`);
        expect(tracking?.start_time).toEqual(AutoriTestutils.createTrackingStartTimeFromUpdatedTime(now));
        expect(tracking?.end_time).toEqual(AutoriTestutils.createTrackingEndTimeFromUpdatedTime(now));
    });

    test('createDbMaintenanceTracking empty tasks', () => {
        const route : ApiRouteData = AutoriTestutils.createApiRouteData(new Date(), createLineStringGeometries(2,5));
        const dbContract = createDbDomainContract("contract-1", DOMAIN_1);
        const tracking : DbMaintenanceTracking|null = AutoriUtils.createDbMaintenanceTracking(1, route, dbContract, []);

        expect(tracking).toBeNull();
    });

    test('createDbDomainTaskMappings', () => {
        const operations = [AutoriTestutils.createApiOperationData(AUTORI_OPERATION_BRUSHING, DOMAIN_1), AutoriTestutils.createApiOperationData(AUTORI_OPERATION_PAVING, DOMAIN_1)];
        const mappings : DbDomainTaskMapping[] = AutoriUtils.createDbDomainTaskMappings(operations, DOMAIN_1);

        expect(mappings.length).toEqual(2);
        mappings.forEach((mapping, index) => {
            expect(mapping.ignore).toEqual(true);
            expect(mapping.domain).toEqual(DOMAIN_1);
            expect(mapping.name).toEqual(UNKNOWN_TASK_NAME);
            expect(mapping.original_id).toEqual(operations[index].id);
        });
    });
});