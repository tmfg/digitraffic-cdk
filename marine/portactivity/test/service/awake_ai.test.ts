import * as sinon from 'sinon';
import {AwakeAiApi, AwakeAiETA, AwakeAiETAShipStatus} from "../../lib/api/awake_ai";
import {AwakeAiService} from "../../lib/service/awake_ai";
import {DbETAShip} from "../../lib/db/timestamps";
import {ApiTimestamp, EventType} from "../../lib/model/timestamp";
import {EventSource} from "../../lib/model/eventsource";
import exp from "constants";

describe('service awake.ai', () => {

    test('getETA - ship under way with prediction', async () => {
        const api = createApi();
        const service = new AwakeAiService(api);
        const ship = newDbETAShip();
        const mmsi = 123456789;
        const returnedETA: AwakeAiETA = {
            mmsi,
            imo: ship.imo,
            status: AwakeAiETAShipStatus.UNDER_WAY,
            predictedEta: new Date().toISOString(),
            predictedDestination: ship.locode,
            timestamp: new Date().toISOString()
        };
        sinon.stub(api, 'getETA').returns(Promise.resolve(returnedETA));

        const timestamps = await service.getAwakeAiTimestamps([ship]);

        expectSingleTimeStampToMatch(timestamps, awakeTimestampFromTimestamp(timestamps[0], ship.port_area_code));
    });

    test('getETA - predicted locode differs', async () => {
        const api = createApi();
        const service = new AwakeAiService(api);
        const ship = newDbETAShip();
        const mmsi = 123456789;
        const returnedETA: AwakeAiETA = {
            mmsi,
            imo: ship.imo,
            status: AwakeAiETAShipStatus.UNDER_WAY,
            predictedEta: new Date().toISOString(),
            predictedDestination: ship.locode.split('').reverse().join('') // reverse locode to make not equal
        };
        sinon.stub(api, 'getETA').returns(Promise.resolve(returnedETA));

        const timestamps = await service.getAwakeAiTimestamps([ship]);

        expectSingleTimeStampToMatch(timestamps, awakeTimestampFromTimestamp(timestamps[0], ship.port_area_code));
    });

    test('getETA - ship not under way', async () => {
        const api = createApi();
        const service = new AwakeAiService(api);
        const ship = newDbETAShip();
        const notUnderWayStatuses = [AwakeAiETAShipStatus.STOPPED, AwakeAiETAShipStatus.NOT_PREDICTABLE, AwakeAiETAShipStatus.VESSEL_DATA_NOT_UPDATED];
        const status = notUnderWayStatuses[Math.floor(Math.random() * 2) + 1]; // get random status
        sinon.stub(api, 'getETA').returns(Promise.resolve({
            mmsi: 123456789,
            imo: ship.imo,
            status,
            predictedEta: new Date().toISOString(),
            predictedDestination: ship.locode
        }));

        const timestamps = await service.getAwakeAiTimestamps([ship]);

        expect(timestamps.length).toBe(0);
    });

    test('getETA - no predicted ETA', async () => {
        const api = createApi();
        const service = new AwakeAiService(api);
        const ship = newDbETAShip();
        sinon.stub(api, 'getETA').returns(Promise.resolve({
            mmsi: 123456789,
            imo: ship.imo,
            status: AwakeAiETAShipStatus.UNDER_WAY,
            predictedDestination: ship.locode
        }));

        const timestamps = await service.getAwakeAiTimestamps([ship]);

        expect(timestamps.length).toBe(0);
    });

    test('getETA - no predicted destination', async () => {
        const api = createApi();
        const service = new AwakeAiService(api);
        const ship = newDbETAShip();
        sinon.stub(api, 'getETA').returns(Promise.resolve({
            mmsi: 123456789,
            imo: ship.imo,
            status: AwakeAiETAShipStatus.UNDER_WAY,
            predictedEta: new Date().toISOString()
        }));

        const timestamps = await service.getAwakeAiTimestamps([ship]);

        expect(timestamps.length).toBe(0);
    });

});

function createApi(): AwakeAiApi {
    return new AwakeAiApi('', '');
}

function newDbETAShip(): DbETAShip {
    return {
        imo: 1234567,
        locode: 'FILOL',
        port_area_code: 'FOO',
        portcall_id: 123,
    };
}

function awakeTimestampFromTimestamp(timestamp: ApiTimestamp, portArea?: string): ApiTimestamp {
    return {
        ship: timestamp.ship,
        location: { ...timestamp.location, portArea },
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
