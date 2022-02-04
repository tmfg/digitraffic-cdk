import * as sinon from 'sinon';
import {AwakeAiETAPortService} from "../../lib/service/awake_ai_eta_port";
import {AwakeAiETAPortApi, AwakeAiPortResponse, AwakeAiPortResponseType} from "../../lib/api/awake_ai_port";
import {randomIMO, randomMMSI} from "../testdata";
import {
    AwakeAiPredictionType,
    AwakeAiShipStatus,
    AwakeAiVoyageEtaPrediction,
    AwakeAiZoneType,
} from "../../lib/api/awake_common";
import {getRandomNumber, randomBoolean, shuffle} from "digitraffic-common/test/testutils";
import moment from "moment-timezone";

describe('AwakeAiETAPortService(', () => {

    test('getAwakeAiTimestamps - correct', async () => {
        const api = createApi();
        const service = new AwakeAiETAPortService(api);
        sinon.stub(api, 'getETAs').returns(Promise.resolve(createResponse()));

        const timestamps = await service.getAwakeAiTimestamps('FILOL');

        expect(timestamps.length).toBe(1);
    });

    test('getAwakeAiTimestamps - no schedule', async () => {
        const api = createApi();
        const service = new AwakeAiETAPortService(api);
        const voyageTimestamp = createResponse();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (voyageTimestamp as any).schedule = undefined;
        sinon.stub(api, 'getETAs').returns(Promise.resolve(voyageTimestamp));

        const timestamps = await service.getAwakeAiTimestamps('FILOL');

        expect(timestamps.length).toBe(0);
    });

    test('getAwakeAiTimestamps - not underway', async () => {
        const api = createApi();
        const service = new AwakeAiETAPortService(api);
        const voyageTimestamp = createResponse({
            voyageStatus: shuffle([AwakeAiShipStatus.STOPPED, AwakeAiShipStatus.NOT_PREDICTABLE, AwakeAiShipStatus.VESSEL_DATA_NOT_UPDATED])[0],
        });
        sinon.stub(api, 'getETAs').returns(Promise.resolve(voyageTimestamp));

        const timestamps = await service.getAwakeAiTimestamps('FILOL');

        expect(timestamps.length).toBe(0);
    });

    test('getAwakeAiTimestamps - non-ETA', async () => {
        const api = createApi();
        const service = new AwakeAiETAPortService(api);
        const voyageTimestamp = createResponse({
            predictionType: randomBoolean() ? AwakeAiPredictionType.TRAVEL_TIME : AwakeAiPredictionType.DESTINATION,
        });
        sinon.stub(api, 'getETAs').returns(Promise.resolve(voyageTimestamp));

        const timestamps = await service.getAwakeAiTimestamps('FILOL');

        expect(timestamps.length).toBe(0);
    });

    test('getAwakeAiTimestamps - 24 hours or closer', async () => {
        const api = createApi();
        const service = new AwakeAiETAPortService(api);
        const voyageTimestamp = createResponse({
            arrivalTime: moment().subtract(getRandomNumber(1, 23), 'hour').toDate(),
        });
        sinon.stub(api, 'getETAs').returns(Promise.resolve(voyageTimestamp));

        const timestamps = await service.getAwakeAiTimestamps('FILOL');

        expect(timestamps.length).toBe(0);
    });

});

function createApi() {
    return new AwakeAiETAPortApi('', '');
}

function createResponse(options?: {
    arrivalTime?: Date,
    voyageStatus?: AwakeAiShipStatus,
    predictionType?: AwakeAiPredictionType,
}): AwakeAiPortResponse {
    return {
        type: AwakeAiPortResponseType.OK,
        schedule: [{
            ship: {
                imo: randomIMO(),
                mmsi: randomMMSI(),
            },
            voyage: {
                voyageStatus: options?.voyageStatus ?? AwakeAiShipStatus.UNDER_WAY,
                predictions: [{
                    predictionType: options?.predictionType ?? AwakeAiPredictionType.ETA,
                    locode: 'FILOL',
                    zoneType: AwakeAiZoneType.BERTH,
                    recordTime: new Date().toISOString(),
                    arrivalTime: options?.arrivalTime ?? moment().subtract(25, 'hour').toISOString(),
                } as AwakeAiVoyageEtaPrediction],
                sequenceNo: 1,
            },
        }],
    };
}