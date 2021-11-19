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

describe('service awake.ai', () => {

    test('getETA - ship under way with prediction', async () => {
        const api = createApi();
        const service = new AwakeAiETAService(api);
        const ship = newDbETAShip();
        const mmsi = 123456789;
        sinon.stub(api, 'getETA').returns(Promise.resolve(createVoyageResponse(ship.locode, ship.imo, mmsi)));

        const timestamps = await service.getAwakeAiTimestamps([ship]);

        expectSingleTimeStampToMatch(timestamps, awakeTimestampFromTimestamp(timestamps[0], ship.port_area_code));
    });

    test('getETA - predicted locode differs', async () => {
        const api = createApi();
        const service = new AwakeAiETAService(api);
        const ship = newDbETAShip();
        const mmsi = 123456789;
        sinon.stub(api, 'getETA').returns(Promise.resolve(createVoyageResponse('FIHEH', ship.imo, mmsi)));

        const timestamps = await service.getAwakeAiTimestamps([ship]);

        expectSingleTimeStampToMatch(timestamps, awakeTimestampFromTimestamp(timestamps[0], ship.port_area_code));
    });

        test('getETA - ship not under way', async () => {
            const api = createApi();
            const service = new AwakeAiETAService(api);
            const ship = newDbETAShip();
            const mmsi = 123456789;
            const notUnderWayStatuses = [AwakeAiVoyageShipStatus.STOPPED, AwakeAiVoyageShipStatus.NOT_PREDICTABLE, AwakeAiVoyageShipStatus.VESSEL_DATA_NOT_UPDATED];
            const status = notUnderWayStatuses[Math.floor(Math.random() * 2) + 1]; // get random status
            sinon.stub(api, 'getETA').returns(Promise.resolve(createVoyageResponse(ship.locode, ship.imo, mmsi, {
                status
            })));

            const timestamps = await service.getAwakeAiTimestamps([ship]);

            expect(timestamps.length).toBe(0);
        });

        test('getETA - not predictable', async () => {
            const api = createApi();
            const service = new AwakeAiETAService(api);
            const ship = newDbETAShip();
            sinon.stub(api, 'getETA').returns(Promise.resolve({
                type: AwakeAiETAResponseType.OK,
                schedule: {
                    ship: {
                        imo: ship.imo,
                        mmsi: 123456789
                    },
                    predictability: randomBoolean() ? AwakeAiVoyagePredictability.NOT_PREDICTABLE : AwakeAiVoyagePredictability.SHIP_DATA_NOT_UPDATED,
                    predictedVoyages: []
                }
            }));

            const timestamps = await service.getAwakeAiTimestamps([ship]);

            expect(timestamps.length).toBe(0);
        });

    test('getETA - no predicted voyages', async () => {
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

    test('getETA - no ETA predictions', async () => {
        const api = createApi();
        const service = new AwakeAiETAService(api);
        const ship = newDbETAShip();
        const response = createVoyageResponse(ship.locode, ship.imo, 123456789);
        /* eslint-disable @typescript-eslint/no-explicit-any */
        (response.schedule as any).predictedVoyages[0]['predictions'] = [];
        sinon.stub(api, 'getETA').returns(Promise.resolve(response));

        const timestamps = await service.getAwakeAiTimestamps([ship]);

        expect(timestamps.length).toBe(0);
    });

        test('getETA - no predicted destination', async () => {
            const api = createApi();
            const service = new AwakeAiETAService(api);
            const ship = newDbETAShip();
            const response = createVoyageResponse(ship.locode, ship.imo, 123456789);
            /* eslint-disable @typescript-eslint/no-explicit-any */
            delete (response.schedule as any).predictedVoyages[0].predictions[0]['locode'];
            sinon.stub(api, 'getETA').returns(Promise.resolve(response));

            const timestamps = await service.getAwakeAiTimestamps([ship]);

            expect(timestamps.length).toBe(0);
        });

        test('getETA - port outside Finland', async () => {
            const api = createApi();
            const service = new AwakeAiETAService(api);
            const ship = newDbETAShip();
            const response = createVoyageResponse('EEMUG', ship.imo, 123456789);
            sinon.stub(api, 'getETA').returns(Promise.resolve(response));

            const timestamps = await service.getAwakeAiTimestamps([ship]);

            expect(timestamps.length).toBe(0);
        });

        test('getETA - port locode override', async () => {
            const api = createApi();
            const service = new AwakeAiETAService(api);
            const ship = newDbETAShip(service.overriddenDestinations[getRandomInteger(0, service.overriddenDestinations.length - 1)]);
            const response = createVoyageResponse('FIKEK', ship.imo, 123456789);
            sinon.stub(api, 'getETA').returns(Promise.resolve(response));

            const timestamps = await service.getAwakeAiTimestamps([ship]);

            expect(timestamps.length).toBe(1);
            const expectedTimestamp = awakeTimestampFromTimestamp(timestamps[0], ship.port_area_code);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (expectedTimestamp.location as any).port = ship.locode;
            expectSingleTimeStampToMatch(timestamps, expectedTimestamp);
        });

});

function createVoyageResponse(
    locode: string,
    imo: number,
    mmsi: number,
    options?: {
        status?: AwakeAiVoyageShipStatus
    }): AwakeAiVoyageResponse {

    const etaPrediction: AwakeAiVoyageEtaPrediction = {
        recordTime: new Date().toISOString(),
        locode: locode,
        predictionType: AwakeAiVoyagePredictionType.ETA,
        arrivalTime: new Date().toISOString(),
        zoneType: AwakeAiZoneType.BERTH
    };

    return {
        type: AwakeAiETAResponseType.OK,
        schedule: {
            ship: {
                mmsi,
                imo
            },
            predictability: AwakeAiVoyagePredictability.PREDICTABLE,
            predictedVoyages: [{
                voyageStatus: options?.status ?? AwakeAiVoyageShipStatus.UNDER_WAY,
                sequenceNo: 0,
                predictions: [etaPrediction]
            }]
        }
    };
}

function createApi(): AwakeAiVoyagesApi {
    return new AwakeAiVoyagesApi('', '');
}

function newDbETAShip(locode?: string): DbETAShip {
    return {
        imo: 1234567,
        locode: locode ?? 'FILOL',
        port_area_code: 'FOO',
        portcall_id: 123,
    };
}

function awakeTimestampFromTimestamp(timestamp: ApiTimestamp, portArea?: string): ApiTimestamp {
    return {
        ship: timestamp.ship,
        location: {...timestamp.location, portArea},
        source: EventSource.AWAKE_AI,
        eventType: EventType.ETA,
        eventTime: timestamp.eventTime,
        recordTime: timestamp.recordTime
    };
}

function expectSingleTimeStampToMatch(timestamps: ApiTimestamp[], expectedTimestamp: ApiTimestamp) {
    expect(timestamps.length).toBe(1);
    expect(timestamps[0]).toMatchObject(expectedTimestamp);
}
