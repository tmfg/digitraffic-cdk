import * as sinon from 'sinon';
import {AwakeAiETAPortService} from "../../lib/service/awake_ai_eta_port";
import {AwakeAiETAPortApi, AwakeAiPortResponse, AwakeAiPortResponseType} from "../../lib/api/awake_ai_port";
import {randomIMO, randomMMSI} from "../testdata";
import {
    AwakeAiPrediction,
    AwakeAiPredictionType,
    AwakeAiShipStatus,
    AwakeAiVoyageEtaPrediction,
    AwakeAiZoneType,
} from "../../lib/api/awake_common";
import {getRandomNumber, randomBoolean, shuffle} from "@digitraffic/common/test/testutils";
import moment from "moment-timezone";

describe('AwakeAiETAPortService(', () => {

    test('getAwakeAiTimestamps - correct needs to include port call prediction', async () => {
        const api = createApi();
        const service = new AwakeAiETAPortService(api);
        sinon.stub(api, 'getETAs').returns(Promise.resolve(createResponse({includePortCallPrediction: true})));

        const timestamps = await service.getAwakeAiTimestamps('FILOL');

        expect(timestamps.length).toBe(1);
    });

    test('getAwakeAiTimestamps - no schedule', async () => {
        const api = createApi();
        const service = new AwakeAiETAPortService(api);
        const voyageTimestamp = createResponse();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
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
    includePortCallPrediction?: boolean,
}): AwakeAiPortResponse {
    const predictions: AwakeAiPrediction[] = [{
        predictionType: options?.predictionType ?? AwakeAiPredictionType.ETA,
        locode: 'FILOL',
        zoneType: AwakeAiZoneType.BERTH,
        recordTime: new Date().toISOString(),
        arrivalTime: options?.arrivalTime ?? moment().add(25, 'hour').toISOString(),
    } as AwakeAiVoyageEtaPrediction];
    return {
        type: AwakeAiPortResponseType.OK,
        schedule: [{
            ship: {
                imo: randomIMO(),
                mmsi: randomMMSI(),
            },
            voyage: {
                voyageStatus: options?.voyageStatus ?? AwakeAiShipStatus.UNDER_WAY,
                predictions: options?.includePortCallPrediction ? predictions.concat([{ predictionType: AwakeAiPredictionType.ARRIVAL_PORT_CALL }]) : predictions,
                sequenceNo: 1,
            },
        }],
    };
}
