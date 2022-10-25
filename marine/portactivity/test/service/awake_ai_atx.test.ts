import moment from "moment-timezone";
import {newAwakeATXMessage, someNumber} from "../testdata";
import * as sinon from 'sinon';
import {
    AwakeAiATXApi,
    AwakeAIATXTimestampMessage,
    AwakeATXZoneEventType,
} from "../../lib/api/awake_ai_atx";
import {AwakeAiATXService} from "../../lib/service/awake_ai_atx";
import {dbTestBase, insertPortAreaDetails, insertPortCall} from "../db-testutil";
import {ApiTimestamp, EventType} from "../../lib/model/timestamp";
import {randomBoolean, shuffle} from "@digitraffic/common/test/testutils";
import {EventSource} from "../../lib/model/eventsource";
import {AwakeAiZoneType} from "../../lib/api/awake_common";
import {WebSocket} from "ws";
import {DTDatabase} from "@digitraffic/common/database/database";

// test file
/* eslint-disable camelcase */

describe('service Awake.AI ATx', dbTestBase((db: DTDatabase) => {

    function createAiATXApi() {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        return new AwakeAiATXApi('', '', WebSocket);
    }

    test('getATXs - no portcall found for ATx', async () => {
        const atxMessage = newAwakeATXMessage();
        const api = createAiATXApi();
        sinon.stub(api, 'getATXs').returns(Promise.resolve([atxMessage]));
        const service = new AwakeAiATXService(api);

        const timestamps = await service.getATXs(0); // timeout is irrelevant

        expect(timestamps.length).toBe(0);
    });

    test('getATXs - ATx with portcall', async () => {
        const zoneEventType = randomBoolean() ? AwakeATXZoneEventType.ARRIVAL : AwakeATXZoneEventType.DEPARTURE;
        const atxMessage = newAwakeATXMessage({zoneEventType});
        const portcallId = 1;
        await createPortcall(atxMessage, portcallId);

        const api = createAiATXApi();
        sinon.stub(api, 'getATXs').returns(Promise.resolve([atxMessage]));
        const service = new AwakeAiATXService(api);

        const timestamps = await service.getATXs(0); // timeout is irrelevant

        expect(timestamps.length).toBe(1);
        const expectedTimestamp: ApiTimestamp = {
            eventType: zoneEventType === AwakeATXZoneEventType.ARRIVAL ? EventType.ATA : EventType.ATD,
            eventTime: atxMessage.eventTimestamp,
            recordTime: atxMessage.eventTimestamp,
            location: {
                port: atxMessage.locodes[0],
            },
            ship: {
                mmsi: atxMessage.mmsi,
                imo: atxMessage.imo,
            },
            source: EventSource.AWAKE_AI,
        };
        expect(timestamps[0]).toMatchObject(expectedTimestamp);
    });

    test('getATXs - ATx with portcall - other than berth events are filtered', async () => {
        const otherThanBerth = shuffle(Object.values(AwakeAiZoneType).filter(zone => zone !== AwakeAiZoneType.BERTH));
        const atxMessage = newAwakeATXMessage({zoneType: otherThanBerth[0]});
        const portcallId = 1;
        await createPortcall(atxMessage, portcallId);

        const api = createAiATXApi();
        sinon.stub(api, 'getATXs').returns(Promise.resolve([atxMessage]));
        const service = new AwakeAiATXService(api);

        const timestamps = await service.getATXs(0); // timeout is irrelevant

        expect(timestamps.length).toBe(0);
    });

    function createPortcall(atxMessage: AwakeAIATXTimestampMessage, portcallId: number) {
        return db.tx(async t => {
            await insertPortCall(t, {
                port_call_id: portcallId,
                radio_call_sign: 'a',
                radio_call_sign_type: 'fake',
                vessel_name: atxMessage.shipName,
                port_call_timestamp: new Date(),
                port_to_visit: atxMessage.locodes[0],
                mmsi: atxMessage.mmsi,
                imo_lloyds: atxMessage.imo,
            });
            await insertPortAreaDetails(t, {
                port_call_id: portcallId,
                port_area_details_id: someNumber(),
                ata: moment().subtract(1, 'hour').toISOString(),
                atd: moment().subtract(1, 'hour').toISOString(),
                eta: moment().add(1, 'hour').toISOString(),
                etd: moment().add(1, 'hour').toISOString(),
            });
        });
    }

}));
