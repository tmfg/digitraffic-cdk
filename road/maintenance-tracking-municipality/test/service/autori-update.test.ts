/* eslint-disable camelcase */
import {DTDatabase, inDatabaseReadonly} from "digitraffic-common/database/database";
import * as LastUpdatedDb from "digitraffic-common/database/last-updated";
import {DataType} from "digitraffic-common/database/last-updated";
import {Asserter} from "digitraffic-common/test/asserter";
import * as CommonDateUtils from "digitraffic-common/utils/date-utils";
import {Position} from "geojson";
import moment from "moment";
import * as sinon from "sinon";
import {AutoriApi} from "../../lib/api/autori";
import {AUTORI_MAX_DISTANCE_BETWEEN_TRACKINGS_M, AUTORI_MAX_MINUTES_TO_HISTORY} from "../../lib/constants";
import * as DataDb from "../../lib/dao/data";
import {ApiContractData, ApiOperationData, ApiRouteData} from "../../lib/model/autori-api-data";
import {DbDomainContract, DbDomainTaskMapping} from "../../lib/model/db-data";
import {UNKNOWN_TASK_NAME} from "../../lib/model/tracking-save-result";
import {AutoriUpdate} from "../../lib/service/autori-update";
import * as AutoriUtils from "../../lib/service/autori-utils";
import * as AutoriTestutils from "../autori-testutil";
import {
    dbTestBase,
    findAllDomaindContracts,
    findAllTrackings,
    insertDomain,
    insertDomaindContract,
    insertDomaindTaskMapping,
    truncate,
} from "../db-testutil";
import {
    AUTORI_OPERATION_BRUSHING,
    AUTORI_OPERATION_PAVING,
    CONTRACT_ID,
    DOMAIN_1,
    HARJA_BRUSHING,
    HARJA_PAVING,
    HARJA_SALTING,
    SOURCE_1,
} from "../testconstants";
import {createLineString, createLineStringGeometries, createZigZagCoordinates} from "../testutil";

const autoriUpdateService = createAutoriUpdateService();

function createAutoriUpdateService() {
    return new AutoriUpdate(AutoriApi.prototype);
}

describe('autori-update-service-test', dbTestBase((db: DTDatabase) => {

    afterEach(async () => {
        sinon.restore();
        await truncate(db);
    });

    test('resolveNextStartTimeForDataFetchFromHistory', () => {
        const lastUdated = moment().subtract(1, 'minutes').toDate();
        const contract = {
            contract: CONTRACT_ID,
            data_last_updated: lastUdated,
            domain: DOMAIN_1,
            start_date: moment().subtract(30, 'days').toDate(),
            end_date: moment().add(30, 'days').toDate(),
            name: "Urakka 1",
            source: "Foo / Bar",
        } as DbDomainContract;
        const resolved = AutoriUtils.resolveNextStartTimeForDataFromApi(contract);
        expect(resolved).toEqual(lastUdated);
    });

    test('resolveNextStartTimeForDataFetchFromHistory over 12 month', () => {
        // max from 1.1.2022 or < 12 months - 1h
        const shouldResolveTo = moment().subtract(AUTORI_MAX_MINUTES_TO_HISTORY, 'minutes').toDate();

        const lastUdated = moment().subtract(13, 'months').toDate();
        const contract = {
            contract: CONTRACT_ID,
            data_last_updated: lastUdated,
            domain: DOMAIN_1,
            start_date: moment().subtract(30, 'days').toDate(),
            end_date: moment().add(30, 'days').toDate(),
            name: "Urakka 1",
            source: "Foo / Bar",
        } as DbDomainContract;
        const resolved = AutoriUtils.resolveNextStartTimeForDataFromApi(contract);
        Asserter.assertToBeCloseTo(resolved.getTime(), shouldResolveTo.getTime(), 10000);
    });

    test('resolveNextStartTimeForDataFetchFromHistory start date', () => {
        const startDate = moment().subtract(2, 'minutes').toDate();
        const contract = {
            contract: CONTRACT_ID,
            data_last_updated: undefined,
            domain: DOMAIN_1,
            start_date: startDate,
            end_date: moment().add(30, 'days').toDate(),
            name: "Urakka 1",
            source: "Foo / Bar",
        } as DbDomainContract;
        const resolved = AutoriUtils.resolveNextStartTimeForDataFromApi(contract);
        expect(resolved).toEqual(startDate);
    });

    test('resolveNextStartTimeForDataFetchFromHistory fall back', () => {
        const fallBackMin = moment().subtract(AUTORI_MAX_MINUTES_TO_HISTORY, 'minutes').subtract(1, 'seconds').toDate().getTime();
        const fallBackMax = moment().subtract(AUTORI_MAX_MINUTES_TO_HISTORY, 'minutes').add(1, 'seconds').toDate().getTime();
        const contract = {
            contract: CONTRACT_ID,
            data_last_updated: undefined,
            domain: DOMAIN_1,
            start_date: undefined,
            end_date: undefined,
            name: "Urakka 1",
            source: "Foo / Bar",
        } as DbDomainContract;
        const resolved = AutoriUtils.resolveNextStartTimeForDataFromApi(contract);
        console.info(`min ${fallBackMin} actual ${resolved.getTime()} max ${fallBackMax}`);
        expect(resolved.getTime()).toBeGreaterThanOrEqual(fallBackMin);
        expect(resolved.getTime()).toBeLessThanOrEqual(fallBackMax);
    });

    test('updateTasks', async () => {
        await insertDomain(db, DOMAIN_1, SOURCE_1);

        const operations = [
            AutoriTestutils.createApiOperationData(AUTORI_OPERATION_BRUSHING, DOMAIN_1),
            AutoriTestutils.createApiOperationData(AUTORI_OPERATION_PAVING, DOMAIN_1),
        ];
        mockGetOperationsApiResponse(operations);

        await autoriUpdateService.updateTaskMappingsForDomain(DOMAIN_1);

        const taskMappings1: DbDomainTaskMapping[] = await inDatabaseReadonly((ro: DTDatabase) => {
            return DataDb.getTaskMappings(ro, DOMAIN_1);
        });

        expect(taskMappings1.length).toEqual(2);
        expect(taskMappings1[0].name).toEqual(UNKNOWN_TASK_NAME);
        expect(taskMappings1[1].name).toEqual(UNKNOWN_TASK_NAME);
        expect(taskMappings1.find(t => t.original_id == AUTORI_OPERATION_BRUSHING)?.domain).toEqual(DOMAIN_1);
        expect(taskMappings1.find(t => t.original_id == AUTORI_OPERATION_PAVING)?.domain).toEqual(DOMAIN_1);
    });

    test('updateTasks existing not changed', async () => {
        await insertDomain(db, DOMAIN_1, SOURCE_1);
        await insertDomaindTaskMapping(
            db, HARJA_SALTING ,AUTORI_OPERATION_BRUSHING, DOMAIN_1, false,
        );

        const operations = [
            AutoriTestutils.createApiOperationData(AUTORI_OPERATION_BRUSHING, DOMAIN_1),
        ];
        mockGetOperationsApiResponse(operations);

        await autoriUpdateService.updateTaskMappingsForDomain(DOMAIN_1);

        const taskMappings1: DbDomainTaskMapping[] = await inDatabaseReadonly((ro: DTDatabase) => {
            return DataDb.getTaskMappings(ro, DOMAIN_1);
        });

        expect(taskMappings1.length).toEqual(1);
        expect(taskMappings1[0].name).toEqual(HARJA_SALTING);
        expect(taskMappings1[0].ignore).toEqual(false);
        expect(taskMappings1[0].domain).toEqual(DOMAIN_1);
        expect(taskMappings1[0].original_id).toEqual(AUTORI_OPERATION_BRUSHING);
    });

    test('updateContracts', async () => {
        const contract1Name = "Urakka 1";
        const contract2Name = "Urakka 2";
        const contract1NewEndDate = moment().add(1, 'years').toDate();
        const contracts = [
            AutoriTestutils.createApiContractData(contract1Name, contract1NewEndDate),
            AutoriTestutils.createApiContractData(contract2Name),
        ];
        await insertDomain(db, DOMAIN_1, SOURCE_1);

        // Insert one exiting contract with endin date today
        const contract1 = contracts[0];
        await insertDomaindContract(
            db, DOMAIN_1, contract1.id, contract1.name, SOURCE_1, contract1.startDate ? CommonDateUtils.dateFromIsoString(contract1.startDate) : undefined,
            new Date(),
        );

        // api responses with existing contract (with a new end date) and a new one
        mockGetContractsApiResponse(contracts);

        await autoriUpdateService.updateContractsForDomain(DOMAIN_1);

        // We should only get the existing with updated end date as the new one don't have source
        const contractsWithSouce: DbDomainContract[] = await inDatabaseReadonly((ro: DTDatabase) => {
            return DataDb.getContractsWithSource(ro, DOMAIN_1);
        });


        expect(contractsWithSouce.length).toEqual(1);
        expect(contractsWithSouce[0].contract).toEqual(contract1.id);
        expect(contractsWithSouce[0].domain).toEqual(DOMAIN_1);
        expect(contractsWithSouce[0].name).toEqual(contract1Name);
        expect(contractsWithSouce[0].source).toEqual(SOURCE_1);
        expect(contractsWithSouce[0].end_date).toEqual(contract1NewEndDate);

        const all = await findAllDomaindContracts(db, DOMAIN_1);
        const dbContract2 = all.find(c => c.contract == contracts[1].id);
        expect(dbContract2?.name).toEqual(contract2Name);
        expect(dbContract2?.source).toBeNull();
    });

    test('updateTrackings', async () => {
        const contractName = "Urakka 1";
        const past3 = moment().subtract(6, 'minutes').toDate();
        const past2 = moment().subtract(4, 'minutes').toDate();
        const past1 = moment().subtract(2, 'minutes').toDate();

        await insertDomain(db, DOMAIN_1, SOURCE_1);
        await insertDomaindContract(
            db, DOMAIN_1, CONTRACT_ID, contractName, SOURCE_1, moment().subtract(1, 'months').toDate(),
            moment().add(1, 'months').toDate(), past3,
        );
        await insertDomaindTaskMapping(
            db, HARJA_BRUSHING ,AUTORI_OPERATION_BRUSHING, DOMAIN_1, false,
        );
        await insertDomaindTaskMapping(
            db, HARJA_PAVING ,AUTORI_OPERATION_PAVING, DOMAIN_1, false,
        );

        // Create two routes, 2 days and 1 day old
        const route2d: ApiRouteData = AutoriTestutils.createApiRouteData(past2, createLineStringGeometries(1, 1), [AUTORI_OPERATION_BRUSHING]);
        const route1d: ApiRouteData = AutoriTestutils.createApiRouteData(past1, createLineStringGeometries(1, 1), [AUTORI_OPERATION_PAVING]);

        // Sub api to return those routes
        // const stub = getStubForGetNextRouteDataForContract();
        // mockGetNextRouteDataForContractApiResponse(stub, contract, past3, [route2d]);
        // mockGetNextRouteDataForContractApiResponse(stub, contract, past2, [route1d]);
        // mockGetNextRouteDataForContractApiResponse(stub, contract, past1, []);
        mockGetWorkEventsApiResponse([route2d, route1d]);
        await autoriUpdateService.updateTrackingsForDomain(DOMAIN_1);
        const updateTime = Date.now();
        const trackings = await findAllTrackings(db, DOMAIN_1);
        expect(trackings.length).toEqual(2);
        const olderTracking = trackings.find(t => t.message_original_id == route2d.id);
        const latestTracking = trackings.find(t => t.message_original_id == route1d.id);

        expect(olderTracking?.tasks.length).toEqual(1);
        expect(olderTracking?.tasks).toContain(HARJA_BRUSHING);
        expect(olderTracking?.start_time).toEqual(AutoriTestutils.createTrackingStartTimeFromUpdatedTime(past2));
        expect(olderTracking?.end_time).toEqual(AutoriTestutils.createTrackingEndTimeFromUpdatedTime(past2));

        expect(latestTracking?.tasks.length).toEqual(1);
        expect(latestTracking?.tasks).toContain(HARJA_PAVING);
        expect(latestTracking?.start_time).toEqual(AutoriTestutils.createTrackingStartTimeFromUpdatedTime(past1));
        expect(latestTracking?.end_time).toEqual(AutoriTestutils.createTrackingEndTimeFromUpdatedTime(past1));

        const checked = await LastUpdatedDb.getLastUpdated(db, DataType.MAINTENANCE_TRACKING_DATA_CHECKED);
        const updated = await LastUpdatedDb.getLastUpdated(db, DataType.MAINTENANCE_TRACKING_DATA);
        Asserter.assertToBeCloseTo(<number>checked?.getTime(), updateTime, 500);
        Asserter.assertToBeCloseTo(<number>updated?.getTime(), updateTime, 500);

        // Check all coordinates has z value 0.5
        trackings.forEach((value, i) => {
            expect(value.last_point.coordinates[2]).toEqual(0.5);
            value.line_string?.coordinates.forEach((c, i2) => {
                expect(c[2]).toEqual(0.5);
            });
        });
    });

    test('updateTrackings and set previous reference', async () => {
        const contractName = "Urakka 1";
        const updated1 = moment().subtract(15, 'minutes').toDate();
        const updated2 = moment(updated1).add(5, 'minutes').toDate();
        const updated3 = moment().subtract(2, 'minutes').toDate();

        await insertDomain(db, DOMAIN_1, SOURCE_1);
        await insertDomaindContract(
            db, DOMAIN_1, CONTRACT_ID, contractName, SOURCE_1, moment().subtract(1, 'months').toDate(),
            moment().add(1, 'months').toDate(), updated1,
        );
        await insertDomaindTaskMapping(
            db, HARJA_BRUSHING ,AUTORI_OPERATION_BRUSHING, DOMAIN_1, false,
        );
        await insertDomaindTaskMapping(
            db, HARJA_PAVING ,AUTORI_OPERATION_PAVING, DOMAIN_1, false,
        );

        // Create two routes, 2 days and 1 day old
        const coordinates: Position[] = createZigZagCoordinates(30, AUTORI_MAX_DISTANCE_BETWEEN_TRACKINGS_M-10);
        const coords1 = coordinates.slice(0, 10); //L:10 this end coordinate is the same
        const coords2 = coordinates.slice(9, 14);//L:5 as the start coodinate here.
        const coords3 = coordinates.slice(13, 30); //L:17 And here same for the previous one
        const routes: ApiRouteData[] =
               [AutoriTestutils.createApiRouteData(updated1, [createLineString(coords1)], [AUTORI_OPERATION_BRUSHING]),
                   AutoriTestutils.createApiRouteData(updated2, [createLineString(coords2)], [AUTORI_OPERATION_BRUSHING]),
                   AutoriTestutils.createApiRouteData(updated3, [createLineString(coords3)], [AUTORI_OPERATION_BRUSHING])];

        mockGetWorkEventsApiResponse(routes);
        await autoriUpdateService.updateTrackingsForDomain(DOMAIN_1);

        const trackings = await findAllTrackings(db, DOMAIN_1);

        expect(trackings.length).toEqual(3);
        // TODO Warning:(295, 33) Error: expect(received).toEqual(expected) // deep equality Expected: null Received: 264
        expect(trackings[0].id).toBe(trackings[1].previous_tracking_id);
        expect(trackings[1].id).toBe(trackings[2].previous_tracking_id);
        expect(trackings[0].line_string?.coordinates?.length).toEqual(10);
        expect(trackings[1].line_string?.coordinates?.length).toEqual(5);
        expect(trackings[2].line_string?.coordinates?.length).toEqual(17);
        expect(trackings[2].line_string?.coordinates?.length).toEqual(17);
    });

    function mockGetOperationsApiResponse(response: ApiOperationData[]) {
        return sinon.stub(AutoriApi.prototype, 'getOperations').returns(Promise.resolve(response));
    }

    function mockGetContractsApiResponse(response: ApiContractData[]) {
        return sinon.stub(AutoriApi.prototype, 'getContracts').returns(Promise.resolve(response));
    }

    function mockGetWorkEventsApiResponse(response: ApiRouteData[]) {
        return sinon.stub(AutoriApi.prototype, 'getNextRouteDataForContract')
            .withArgs(sinon.match.any, sinon.match.any, sinon.match.any)
            .returns(Promise.resolve(response));
    }
}));