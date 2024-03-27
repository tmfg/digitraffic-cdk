import { newAwakeATXMessage, someNumber } from "../testdata.js";
import type { AwakeAIATXTimestampMessage } from "../../api/awake-ai-atx.js";
import { AwakeAiATXApi, AwakeATXZoneEventType } from "../../api/awake-ai-atx.js";
import { AwakeAiATXService } from "../../service/awake-ai-atx.js";
import { dbTestBase, insertPortAreaDetails, insertPortCall } from "../db-testutil.js";
import type { ApiTimestamp } from "../../model/timestamp.js";
import { EventType } from "../../model/timestamp.js";
import { randomBoolean, shuffle } from "@digitraffic/common/dist/test/testutils";
import { EventSource } from "../../model/eventsource.js";
import { AwakeAiZoneType } from "../../api/awake-common.js";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { WebSocket } from "ws";
import { addHours, subHours } from "date-fns";
import { assertDefined } from "../test-utils.js";
import { jest } from "@jest/globals";

describe(
    "service Awake.AI ATx",
    dbTestBase((db: DTDatabase) => {
        function createAiATXApi(): AwakeAiATXApi {
            return new AwakeAiATXApi("", "", WebSocket);
        }

        test("getATXs - no portcall found for ATx", async () => {
            const atxMessage = newAwakeATXMessage();
            const api = createAiATXApi();
            jest.spyOn(AwakeAiATXApi.prototype, "getATXs").mockResolvedValue([atxMessage]);
            const service = new AwakeAiATXService(api);

            const timestamps = await service.getATXs(0); // timeout is irrelevant

            expect(timestamps.length).toBe(0);
        });

        test("getATXs - ATx with portcall", async () => {
            const zoneEventType = randomBoolean()
                ? AwakeATXZoneEventType.ARRIVAL
                : AwakeATXZoneEventType.DEPARTURE;
            const atxMessage = newAwakeATXMessage({ zoneEventType });
            const portcallId = 1;
            await createPortcall(atxMessage, portcallId);

            const api = createAiATXApi();
            jest.spyOn(AwakeAiATXApi.prototype, "getATXs").mockResolvedValue([atxMessage]);
            const service = new AwakeAiATXService(api);

            const timestamps = await service.getATXs(0); // timeout is irrelevant

            expect(timestamps.length).toBe(1);

            const locode = atxMessage.locodes[0];
            assertDefined(locode);

            const expectedTimestamp: ApiTimestamp = {
                eventType: zoneEventType === AwakeATXZoneEventType.ARRIVAL ? EventType.ATA : EventType.ATD,
                eventTime: atxMessage.eventTimestamp,
                recordTime: atxMessage.eventTimestamp,
                location: {
                    port: locode
                },
                ship: {
                    mmsi: atxMessage.mmsi,
                    imo: atxMessage.imo
                },
                source: EventSource.AWAKE_AI
            };
            expect(timestamps[0]).toMatchObject(expectedTimestamp);
        });

        test("getATXs - ATx with portcall - other than berth events are filtered", async () => {
            const otherThanBerth = shuffle(
                Object.values(AwakeAiZoneType).filter((zone) => zone !== AwakeAiZoneType.BERTH)
            );
            const atxMessage = newAwakeATXMessage({
                zoneType: otherThanBerth[0]
            });
            const portcallId = 1;
            await createPortcall(atxMessage, portcallId);

            const api = createAiATXApi();
            jest.spyOn(AwakeAiATXApi.prototype, "getATXs").mockResolvedValue([atxMessage]);
            const service = new AwakeAiATXService(api);

            const timestamps = await service.getATXs(0); // timeout is irrelevant

            expect(timestamps.length).toBe(0);
        });

        function createPortcall(atxMessage: AwakeAIATXTimestampMessage, portcallId: number): Promise<void> {
            const locode = atxMessage.locodes[0];
            assertDefined(locode);
            return db.tx(async (t) => {
                await insertPortCall(t, {
                    port_call_id: portcallId,
                    radio_call_sign: "a",
                    radio_call_sign_type: "fake",
                    vessel_name: atxMessage.shipName,
                    port_call_timestamp: new Date(),
                    port_to_visit: locode,
                    mmsi: atxMessage.mmsi,
                    imo_lloyds: atxMessage.imo
                });
                await insertPortAreaDetails(t, {
                    port_call_id: portcallId,
                    port_area_details_id: someNumber(),
                    ata: subHours(Date.now(), 1).toISOString(),
                    atd: subHours(Date.now(), 1).toISOString(),
                    eta: addHours(Date.now(), 1).toISOString(),
                    etd: addHours(Date.now(), 1).toISOString()
                });
            });
        }
    })
);
