/* eslint-disable camelcase */
import {DTDatabase} from "@digitraffic/common/database/database";
import * as LastUpdatedDb from "@digitraffic/common/database/last-updated";
import {Asserter} from "@digitraffic/common/test/asserter";
import {getRandomInteger} from "@digitraffic/common/test/testutils";
import {Position} from "geojson";
import {getRandompId} from "maintenance-tracking/test/testdata";
import moment from "moment";
import * as sinon from "sinon";
import {PaikanninApi} from "../../lib/api/paikannin";
import {PAIKANNIN_MAX_DISTANCE_BETWEEN_TRACKINGS_M} from "../../lib/constants";
import * as DataDb from "../../lib/dao/data";
import {DbDomainContract, DbDomainTaskMapping, DbMaintenanceTracking} from "../../lib/model/db-data";
import {ApiDevice, ApiIoChannel, ApiWorkeventDevice} from "../../lib/model/paikannin-api-data";
import {UNKNOWN_TASK_NAME} from "../../lib/model/tracking-save-result";
import {PaikanninUpdate} from "../../lib/service/paikannin-update";
import {
    dbTestBase,
    findAllTrackings,
    getDomaindContract,
    insertDbDomaindContract,
    insertDomain,
    insertDomaindTaskMapping,
    truncate,
} from "../db-testutil";
import {
    DOMAIN_1,
    HARJA_BRUSHING,
    HARJA_PAVING,
    PAIKANNIN_OPERATION_BRUSHING,
    PAIKANNIN_OPERATION_PAVING,
    PAIKANNIN_OPERATION_SALTING,
    POINT_START,
} from "../testconstants";
import {
    createApiRouteDataForEveryMinute,
    createDbDomainContract,
    createLineString,
    createLineStringGeometry,
    createZigZagCoordinates,
} from "../testutil";

const paikanninUpdateService = createPaikanninUpdateService();

function createPaikanninUpdateService() {
    return new PaikanninUpdate(PaikanninApi.prototype);
}

describe('paikannin-update-service-test', dbTestBase((db: DTDatabase) => {

    afterEach(async () => {
        sinon.restore();
        await truncate(db);
    });

    test('upsertContractForDomain', async () => {
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

    test('updateTaskMappingsForDomain', async () => {
        await insertDomain(db, DOMAIN_1);

        const ioChannels1: ApiIoChannel[]= [createApiIoChannel(PAIKANNIN_OPERATION_SALTING.name), createApiIoChannel(PAIKANNIN_OPERATION_BRUSHING.name)];
        const device1 :ApiDevice = createDevice(ioChannels1);
        const ioChannels2: ApiIoChannel[]= [createApiIoChannel(PAIKANNIN_OPERATION_SALTING.name), createApiIoChannel(PAIKANNIN_OPERATION_PAVING.name)];
        const device2 :ApiDevice = createDevice(ioChannels2);
        mockGetDevicesApiResponse([device1, device2]);

        await paikanninUpdateService.updateTaskMappingsForDomain(DOMAIN_1);

        const mappings: DbDomainTaskMapping[] = await DataDb.getTaskMappings(db, DOMAIN_1);
        expect(mappings.length).toEqual(3);

        const operationNames: string[] = mappings.map((value) => value.original_id);
        expect(operationNames.includes(PAIKANNIN_OPERATION_SALTING.name)).toEqual(true);
        expect(operationNames.includes(PAIKANNIN_OPERATION_BRUSHING.name)).toEqual(true);
        expect(operationNames.includes(PAIKANNIN_OPERATION_PAVING.name)).toEqual(true);
        mappings.forEach(value => expect(value.ignore).toEqual(true));
        mappings.forEach(value => expect(value.name).toEqual(UNKNOWN_TASK_NAME));
    });

    test('updateTrackings', async () => {
        await insertDomain(db, DOMAIN_1);
        await insertDbDomaindContract(db, createDbDomainContract(DOMAIN_1, DOMAIN_1));

        await insertDomaindTaskMapping(
            db, HARJA_BRUSHING , PAIKANNIN_OPERATION_BRUSHING.name, DOMAIN_1, false,
        );
        await insertDomaindTaskMapping(
            db, HARJA_PAVING ,PAIKANNIN_OPERATION_PAVING.name, DOMAIN_1, false,
        );

        // Create two routes, 10 and 0 minutes old
        const past10 = moment().subtract(10, 'minutes').toDate();
        const past0 = new Date();
        const route2d: ApiWorkeventDevice = createApiRouteDataForEveryMinute(1, past10, createLineStringGeometry(10, 200), [PAIKANNIN_OPERATION_BRUSHING]);
        const route1d: ApiWorkeventDevice = createApiRouteDataForEveryMinute(1, past0, createLineStringGeometry(9, 200), [PAIKANNIN_OPERATION_PAVING]);

        await mockGetWorkEventsApiResponse([route2d]);
        await paikanninUpdateService.updateTrackingsForDomain(DOMAIN_1);
        await sinon.restore();
        await mockGetWorkEventsApiResponse([route1d]);
        await paikanninUpdateService.updateTrackingsForDomain(DOMAIN_1);

        const trackings = await findAllTrackings(db, DOMAIN_1);

        expect(trackings.length).toEqual(2);
        expect(trackings[0].end_time).toEqual(past10);
        expect(trackings[1].end_time).toEqual(past0);

        expect(trackings[0].line_string?.coordinates.length).toEqual(10);
        expect(trackings[1].line_string?.coordinates.length).toEqual(9);

        const checked = await LastUpdatedDb.getLastUpdatedWithSubtype(db, LastUpdatedDb.DataType.MAINTENANCE_TRACKING_DATA_CHECKED, DOMAIN_1);
        Asserter.assertToBeCloseTo(<number>checked?.getTime(), past0.getTime(), 700);
    });

    test('updateTrackings invalid linestring', async () => {
        await insertDomain(db, DOMAIN_1);
        await insertDbDomaindContract(db, createDbDomainContract(DOMAIN_1, DOMAIN_1));

        await insertDomaindTaskMapping(
            db, HARJA_BRUSHING , PAIKANNIN_OPERATION_BRUSHING.name, DOMAIN_1, false,
        );
        await insertDomaindTaskMapping(
            db, HARJA_PAVING ,PAIKANNIN_OPERATION_PAVING.name, DOMAIN_1, false,
        );

        // Create one route with two equal points
        const route: ApiWorkeventDevice = createApiRouteDataForEveryMinute(1, new Date(), createLineString([POINT_START, POINT_START]), [PAIKANNIN_OPERATION_BRUSHING]);

        await mockGetWorkEventsApiResponse([route]);
        await paikanninUpdateService.updateTrackingsForDomain(DOMAIN_1);

        const trackings = await findAllTrackings(db, DOMAIN_1);

        expect(trackings.length).toEqual(1);
        // As source linestring is two equal point's -> it's invalid and it should not be saved
        expect(trackings[0].line_string).toBeNull();
        Asserter.assertToBeCloseTo(trackings[0].last_point.coordinates[0],POINT_START[0], 0.000001);
        Asserter.assertToBeCloseTo(trackings[0].last_point.coordinates[1],POINT_START[1], 0.000001);
        expect(trackings[0].last_point.coordinates[2]).toEqual(0);
    });

    test('updateTrackings and split on big distance between points', async () => {
        await insertDomain(db, DOMAIN_1);
        await insertDbDomaindContract(db, createDbDomainContract(DOMAIN_1, DOMAIN_1));

        await insertDomaindTaskMapping(
            db, HARJA_BRUSHING , PAIKANNIN_OPERATION_BRUSHING.name, DOMAIN_1, false,
        );

        const ln = createLineStringGeometry(22, PAIKANNIN_MAX_DISTANCE_BETWEEN_TRACKINGS_M-10);
        // remove two elements from the middle so there will be over PAIKANNIN_MAX_DISTANCE_BETWEEN_TRACKINGS_KM jump
        // in the middle of coordinates -> should be divided in two distinct trackings
        ln.coordinates.splice(10, 2);

        // Create one route and big jump between routes, 10 and 0 minutes old
        const end = new Date();
        const route: ApiWorkeventDevice = createApiRouteDataForEveryMinute(1, end, ln, [PAIKANNIN_OPERATION_BRUSHING]);

        await mockGetWorkEventsApiResponse([route]);
        await paikanninUpdateService.updateTrackingsForDomain(DOMAIN_1);
        await sinon.restore();

        const trackings = await findAllTrackings(db, DOMAIN_1);

        expect(trackings.length).toEqual(2);
        expect(trackings[0].end_time).toEqual(moment(end).subtract(10, 'minutes').toDate());
        expect(trackings[1].end_time).toEqual(end);

        expect(trackings[0].line_string?.coordinates.length).toEqual(10);
        expect(trackings[1].line_string?.coordinates.length).toEqual(10);
    });

    test('updateTrackings and continue previous', async () => {
        await insertDomain(db, DOMAIN_1);
        await insertDbDomaindContract(db, createDbDomainContract(DOMAIN_1, DOMAIN_1));

        await insertDomaindTaskMapping(
            db, HARJA_BRUSHING , PAIKANNIN_OPERATION_BRUSHING.name, DOMAIN_1, false,
        );

        const coords = createZigZagCoordinates(20, PAIKANNIN_MAX_DISTANCE_BETWEEN_TRACKINGS_M-10);
        const coords1 = coords.slice(0,10);
        const coords2 = coords.slice(10);


        // Create two routes of one linear work
        const end2 = new Date();
        const end1 = moment(end2).subtract(10, 'minutes').toDate();

        const route1: ApiWorkeventDevice = createApiRouteDataForEveryMinute(1, end1, createLineString(coords1), [PAIKANNIN_OPERATION_BRUSHING]);
        const route2: ApiWorkeventDevice = createApiRouteDataForEveryMinute(1, end2, createLineString(coords2), [PAIKANNIN_OPERATION_BRUSHING]);

        await mockGetWorkEventsApiResponse([route1]);
        await paikanninUpdateService.updateTrackingsForDomain(DOMAIN_1);
        await sinon.restore();
        await mockGetWorkEventsApiResponse([route2]);
        await paikanninUpdateService.updateTrackingsForDomain(DOMAIN_1);

        const trackings: DbMaintenanceTracking[] = await findAllTrackings(db, DOMAIN_1);

        expect(trackings.length).toEqual(2);
        // First tracking's end is extended to next tracking start
        expect(trackings[0].end_time).toEqual(trackings[1].start_time);
        expect(trackings[1].end_time).toEqual(end2);

        expect(trackings[0].id).toEqual(trackings[1].previous_tracking_id);

        const prevEnd: Position = trackings[0].last_point.coordinates;
        const prevLineStringEnd: Position|undefined = trackings[0].line_string?.coordinates[trackings[0].line_string?.coordinates.length-1];
        const nextStart: Position|undefined = trackings[1].line_string?.coordinates[0];

        // Check marked end poind is same as next start as it's extending previous one
        expect(prevEnd[0]).toEqual(nextStart?.[0]);
        expect(prevEnd[1]).toEqual(nextStart?.[1]);
        expect(prevEnd[2]).toEqual(nextStart?.[2]);
        // Check that linestring end poind is also the same as next start
        expect(prevLineStringEnd?.[0]).toEqual(nextStart?.[0]);
        expect(prevLineStringEnd?.[1]).toEqual(nextStart?.[1]);
        expect(prevLineStringEnd?.[2]).toEqual(nextStart?.[2]);
    });

    function mockGetDevicesApiResponse(response: ApiDevice[]) {
        return sinon.stub(PaikanninApi.prototype, 'getDevices').returns(Promise.resolve(response));
    }

    function mockGetWorkEventsApiResponse(response: ApiWorkeventDevice[]) {
        return sinon.stub(PaikanninApi.prototype, 'getWorkEvents')
            .withArgs(sinon.match.any, sinon.match.any)
            .returns(Promise.resolve(response));
    }

    function createDevice(ioChannels: ApiIoChannel[]): ApiDevice {
        return {
            id: getRandompId(),
            description: "Foo",
            ioChannels: ioChannels,
        };
    }

    function createApiIoChannel(name: string): ApiIoChannel {
        return {
            id: getRandomInteger(1, 10000),
            name: name,
            enabled: true,
        };
    }
}));