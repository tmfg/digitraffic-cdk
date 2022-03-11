/* eslint-disable camelcase */
import {
    dbTestBase,
    findAllTrackings,
    getDomaindContract,
    insertDbDomaindContract,
    insertDomain,
    insertDomaindTaskMapping,
    truncate,
} from "../db-testutil";
import {DTDatabase} from "digitraffic-common/database/database";
import * as sinon from "sinon";
import {DbDomainContract, DbDomainTaskMapping, DbMaintenanceTracking} from "../../lib/model/db-data";
import {PaikanninUpdate} from "../../lib/service/paikannin-update";
import {PaikanninApi} from "../../lib/api/paikannin";
import {
    DOMAIN_1,
    HARJA_BRUSHING,
    HARJA_PAVING,
    PAIKANNIN_OPERATION_BRUSHING,
    PAIKANNIN_OPERATION_PAVING,
    PAIKANNIN_OPERATION_SALTING,
} from "../testconstants";
import {ApiDevice, ApiIoChannel, ApiWorkevent, ApiWorkeventDevice, ApiWorkeventIoDevice} from "../../lib/model/paikannin-api-data";
import {getRandompId} from "maintenance-tracking/test/testdata";
import {getRandomInteger} from "digitraffic-common/test/testutils";
import * as DataDb from "../../lib/dao/data";
import {UNKNOWN_TASK_NAME} from "../../lib/model/tracking-save-result";
import moment from "moment";
import {createDbDomainContract, createLineString, createLineStringGeometry, createZigZagCoordinates} from "../testutil";
import {LineString} from "geojson";
import {PAIKANNIN_MAX_DISTANCE_BETWEEN_TRACKINGS_KM} from "../../lib/constants";

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
        const route2d: ApiWorkeventDevice = createApiRouteDataForEveryMinute(1, past10, createLineStringGeometry(10, 0.1), [PAIKANNIN_OPERATION_BRUSHING]);
        const route1d: ApiWorkeventDevice = createApiRouteDataForEveryMinute(1, past0, createLineStringGeometry(9, 0.1), [PAIKANNIN_OPERATION_PAVING]);

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
    });

    test('updateTrackings and split on big distance between points', async () => {
        await insertDomain(db, DOMAIN_1);
        await insertDbDomaindContract(db, createDbDomainContract(DOMAIN_1, DOMAIN_1));

        await insertDomaindTaskMapping(
            db, HARJA_BRUSHING , PAIKANNIN_OPERATION_BRUSHING.name, DOMAIN_1, false,
        );

        const ln = createLineStringGeometry(22, PAIKANNIN_MAX_DISTANCE_BETWEEN_TRACKINGS_KM-0.01);
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

        const coords = createZigZagCoordinates(20, PAIKANNIN_MAX_DISTANCE_BETWEEN_TRACKINGS_KM-0.01);
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
    });

    function createApiRouteDataForEveryMinute(deviceId: number, endTime : Date, geometry : LineString, operations:ApiWorkeventIoDevice[]=[PAIKANNIN_OPERATION_BRUSHING, PAIKANNIN_OPERATION_PAVING, PAIKANNIN_OPERATION_SALTING]) : ApiWorkeventDevice {

        // Update for every event + minute
        const timeMoment = moment(endTime).subtract(geometry.coordinates.length, 'minutes');
        const events: ApiWorkevent[] = geometry.coordinates.map(position => {
            timeMoment.add(1, 'minutes');
            return {
                deviceId: deviceId,
                heading: 0,
                lon: position[0],
                lat: position[1],
                speed: 10,
                altitude: 0,
                deviceName: '' + deviceId,
                timest: timeMoment.toISOString(),
                ioChannels: operations,
                timestamp: timeMoment.toDate(),
            };
        });

        return {
            deviceId: deviceId,
            deviceName: '' + deviceId,
            workEvents: events,
        };
    }

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