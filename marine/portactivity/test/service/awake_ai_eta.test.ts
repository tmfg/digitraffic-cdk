import * as sinon from 'sinon';
import {
    AwakeAiETAResponseType,
    AwakeAiVoyageEtaPrediction,
    AwakeAiVoyagePredictability,
    AwakeAiVoyagePredictionType,
    AwakeAiVoyageResponse,
    AwakeAiVoyagesApi,
    AwakeAiVoyageShipStatus,
} from "../../lib/api/awake_ai_voyages";
import {AwakeAiETAService} from "../../lib/service/awake_ai_eta";
import {DbETAShip} from "../../lib/db/timestamps";
import {ApiTimestamp, EventType} from "../../lib/model/timestamp";
import {EventSource} from "../../lib/model/eventsource";
import {AwakeAiZoneType} from "../../lib/api/awake_common";
import {getRandomInteger, randomBoolean} from "digitraffic-common/test/testutils";
import moment from 'moment-timezone';

// test file
/* eslint-disable camelcase */

describe('service awake.ai', () => {

    test('getAwakeAiTimestamps - creates both ETA and ETB', async () => {
        const api = createApi();
        const service = new AwakeAiETAService(api);
        const ship = newDbETAShip();
        const mmsi = 123456789;
        const voyageTimestamp = createVoyageResponse(ship.locode, ship.imo, mmsi);
        sinon.stub(api, 'getETA').returns(Promise.resolve(voyageTimestamp));

        const timestamps = await service.getAwakeAiTimestamps([ship]);

        expectEtaAndEtb(ship, voyageTimestamp, timestamps);
    });

    test('getAwakeAiTimestamps - no timestamps when predicted locode differs and ETA is >= 24 h', async () => {
        const api = createApi();
        const service = new AwakeAiETAService(api);
        const ship = newDbETAShip('FIKEK', moment().add(getRandomInteger(24, 100), 'hour'));
        sinon.stub(api, 'getETA').returns(Promise.resolve(createVoyageResponse('FILOL', ship.imo, 123456789)));

        const timestamps = await service.getAwakeAiTimestamps([ship]);

        expect(timestamps.length).toBe(0);
    });

    test('getAwakeAiTimestamps - timestamps created when predicted locode differs and ETA is < 24 h', async () => {
        const api = createApi();
        const service = new AwakeAiETAService(api);
        const ship = newDbETAShip('FIKEK', moment().add(getRandomInteger(1, 23), 'hour'));
        const voyageTimestamp = createVoyageResponse('FILOL', ship.imo, 123456789);
        sinon.stub(api, 'getETA').returns(Promise.resolve(voyageTimestamp));

        const timestamps = await service.getAwakeAiTimestamps([ship]);

        expectEtaAndEtb(ship, voyageTimestamp, timestamps);
    });

    test('getAwakeAiTimestamps - ship not under way', async () => {
        const api = createApi();
        const service = new AwakeAiETAService(api);
        const ship = newDbETAShip();
        const mmsi = 123456789;
        const notUnderWayStatuses = [AwakeAiVoyageShipStatus.STOPPED, AwakeAiVoyageShipStatus.NOT_PREDICTABLE, AwakeAiVoyageShipStatus.VESSEL_DATA_NOT_UPDATED];
        const status = notUnderWayStatuses[Math.floor(Math.random() * 2) + 1]; // get random status
        sinon.stub(api, 'getETA').returns(Promise.resolve(createVoyageResponse(ship.locode, ship.imo, mmsi, {
            status,
        })));

        const timestamps = await service.getAwakeAiTimestamps([ship]);

        expect(timestamps.length).toBe(0);
    });

    test('getAwakeAiTimestamps - not predictable', async () => {
        const api = createApi();
        const service = new AwakeAiETAService(api);
        const ship = newDbETAShip();
        sinon.stub(api, 'getETA').returns(Promise.resolve({
            type: AwakeAiETAResponseType.OK,
            schedule: {
                ship: {
                    imo: ship.imo,
                    mmsi: 123456789,
                },
                predictability: randomBoolean() ? AwakeAiVoyagePredictability.NOT_PREDICTABLE : AwakeAiVoyagePredictability.SHIP_DATA_NOT_UPDATED,
                predictedVoyages: [],
            },
        }));

        const timestamps = await service.getAwakeAiTimestamps([ship]);

        expect(timestamps.length).toBe(0);
    });

    test('getAwakeAiTimestamps - no predicted voyages', async () => {
        const api = createApi();
        const service = new AwakeAiETAService(api);
        const ship = newDbETAShip();
        const response = createVoyageResponse(ship.locode, ship.imo, 123456789);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (response.schedule as any).predictedVoyages = [];
        sinon.stub(api, 'getETA').returns(Promise.resolve(response));

        const timestamps = await service.getAwakeAiTimestamps([ship]);

        expect(timestamps.length).toBe(0);
    });

    test('getAwakeAiTimestamps - no ETA predictions', async () => {
        const api = createApi();
        const service = new AwakeAiETAService(api);
        const ship = newDbETAShip();
        const response = createVoyageResponse(ship.locode, ship.imo, 123456789);
        /* eslint-disable @typescript-eslint/no-explicit-any */
        (response.schedule as any).predictedVoyages[0].predictions = [];
        sinon.stub(api, 'getETA').returns(Promise.resolve(response));

        const timestamps = await service.getAwakeAiTimestamps([ship]);

        expect(timestamps.length).toBe(0);
    });

    test('getAwakeAiTimestamps - no predicted destination', async () => {
        const api = createApi();
        const service = new AwakeAiETAService(api);
        const ship = newDbETAShip();
        const response = createVoyageResponse(ship.locode, ship.imo, 123456789);
        /* eslint-disable @typescript-eslint/no-explicit-any */
        delete (response.schedule as any).predictedVoyages[0].predictions[0].locode;
        sinon.stub(api, 'getETA').returns(Promise.resolve(response));

        const timestamps = await service.getAwakeAiTimestamps([ship]);

        expect(timestamps.length).toBe(0);
    });

    test('getAwakeAiTimestamps - port outside Finland', async () => {
        const api = createApi();
        const service = new AwakeAiETAService(api);
        const ship = newDbETAShip();
        const response = createVoyageResponse('EEMUG', ship.imo, 123456789);
        sinon.stub(api, 'getETA').returns(Promise.resolve(response));

        const timestamps = await service.getAwakeAiTimestamps([ship]);

        expect(timestamps.length).toBe(0);
    });

    test('getAwakeAiTimestamps - pilotage ETP', async () => {
        const api = createApi();
        const service = new AwakeAiETAService(api);
        const ship = newDbETAShip();
        const response = createVoyageResponse('FIKEK', ship.imo, 123456789, {
            zoneType: AwakeAiZoneType.PILOT_BOARDING_AREA,
        });
        sinon.stub(api, 'getETA').returns(Promise.resolve(response));

        const timestamps = await service.getAwakeAiTimestamps([ship]);

        expect(timestamps.length).toBe(1);
        expect(timestamps[0]).toMatchObject(awakeTimestampFromTimestamp(timestamps[0], ship.port_area_code, EventType.ETP));
    });

    test('getAwakeAiTimestamps - port locode override', async () => {
        const api = createApi();
        const service = new AwakeAiETAService(api);
        const ship = newDbETAShip(service.overriddenDestinations[getRandomInteger(0, service.overriddenDestinations.length - 1)]);
        const voyageTimestamp = createVoyageResponse('FIKEK', ship.imo, 123456789);
        sinon.stub(api, 'getETA').returns(Promise.resolve(voyageTimestamp));

        const timestamps = await service.getAwakeAiTimestamps([ship]);

        expectEtaAndEtb(ship, voyageTimestamp, timestamps);
    });

    test('getAwakeAiTimestamps - destination set explicitly when original ETA is less than 24 h', async () => {
        const locode = 'FIKEK';
        const api = createApi();
        const service = new AwakeAiETAService(api);
        const ship = newDbETAShip(locode, moment().add(1, 'hour'));
        const getETAStub = sinon.stub(api, 'getETA').returns(Promise.resolve(createVoyageResponse(locode, ship.imo, 123456789)));

        await service.getAwakeAiTimestamps([ship]);

        expect(getETAStub.calledWith(ship.imo, locode)).toBe(true);
    });

    test('getAwakeAiTimestamps - destination not set when original ETA is more than 24 h', async () => {
        const locode = 'FIKEK';
        const api = createApi();
        const service = new AwakeAiETAService(api);
        const ship = newDbETAShip(locode, moment().add(25, 'hour'));
        const getETAStub = sinon.stub(api, 'getETA').returns(Promise.resolve(createVoyageResponse(locode, ship.imo, 123456789)));

        await service.getAwakeAiTimestamps([ship]);

        expect(getETAStub.calledWith(ship.imo)).toBe(true);
    });

    test('getAwakeAiTimestamps - retry', async () => {
        const api = createApi();
        const service = new AwakeAiETAService(api);
        const ship = newDbETAShip();
        const voyageTimestamp = createVoyageResponse(ship.locode, ship.imo, 123456789);
        const apiGetETAStub = sinon.stub(api, 'getETA');
        apiGetETAStub.onFirstCall().returns(Promise.reject('error'));
        apiGetETAStub.onSecondCall().returns(Promise.resolve(voyageTimestamp));

        const timestamps = await service.getAwakeAiTimestamps([ship]);

        expectEtaAndEtb(ship, voyageTimestamp, timestamps);
    });

    test('getAwakeAiTimestamps - retry fail', async () => {
        const api = createApi();
        const service = new AwakeAiETAService(api);
        const ship = newDbETAShip();
        const response = createVoyageResponse(ship.locode, ship.imo, 123456789);
        const apiGetETAStub = sinon.stub(api, 'getETA');
        apiGetETAStub.onFirstCall().returns(Promise.reject('error'));
        apiGetETAStub.onSecondCall().returns(Promise.reject('error'));
        apiGetETAStub.onThirdCall().returns(Promise.resolve(response));

        const timestamps = await service.getAwakeAiTimestamps([ship]);

        expect(timestamps.length).toBe(0);
    });

});

function createVoyageResponse(locode: string,
    imo: number,
    mmsi: number,
    options?: {
        status?: AwakeAiVoyageShipStatus,
        zoneType?: AwakeAiZoneType
    }): AwakeAiVoyageResponse {

    const etaPrediction: AwakeAiVoyageEtaPrediction = {
        recordTime: new Date().toISOString(),
        locode: locode,
        predictionType: AwakeAiVoyagePredictionType.ETA,
        arrivalTime: new Date().toISOString(),
        zoneType: options?.zoneType ?? AwakeAiZoneType.BERTH,
    };

    return {
        type: AwakeAiETAResponseType.OK,
        schedule: {
            ship: {
                mmsi,
                imo,
            },
            predictability: AwakeAiVoyagePredictability.PREDICTABLE,
            predictedVoyages: [{
                voyageStatus: options?.status ?? AwakeAiVoyageShipStatus.UNDER_WAY,
                sequenceNo: 0,
                predictions: [etaPrediction],
            }],
        },
    };
}

function createApi(): AwakeAiVoyagesApi {
    return new AwakeAiVoyagesApi('', '');
}

function newDbETAShip(locode?: string, eta?: moment.Moment): DbETAShip {
    return {
        imo: 1234567,
        locode: locode ?? 'FILOL',
        port_area_code: 'FOO',
        portcall_id: 123,
        eta: eta?.toISOString() ?? moment().add(getRandomInteger(1, 24), 'hour').toISOString(),
    };
}

function awakeTimestampFromTimestamp(timestamp: ApiTimestamp, portArea?: string, eventType?: EventType): ApiTimestamp {
    return {
        ship: timestamp.ship,
        location: {...timestamp.location, portArea},
        source: EventSource.AWAKE_AI,
        eventType: eventType ?? EventType.ETA,
        eventTime: timestamp.eventTime,
        recordTime: timestamp.recordTime,
    };
}

function expectEtaAndEtb(ship: DbETAShip, voyageTimestamp: AwakeAiVoyageResponse, timestamps: ApiTimestamp[]) {
    expect(timestamps.length).toBe(2);
    const etaTimestamp = timestamps.find(ts => ts.eventType === EventType.ETA);
    const etbTimestamp = timestamps.find(ts => ts.eventType === EventType.ETB);
    expect(etaTimestamp).toMatchObject(awakeTimestampFromTimestamp(etaTimestamp as ApiTimestamp, ship.port_area_code, EventType.ETA));
    expect(etbTimestamp).toMatchObject(awakeTimestampFromTimestamp(etbTimestamp as ApiTimestamp, ship.port_area_code, EventType.ETB));
}
