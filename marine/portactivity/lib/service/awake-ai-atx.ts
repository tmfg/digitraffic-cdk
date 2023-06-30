import { AwakeAiATXApi, AwakeAIATXTimestampMessage, AwakeATXZoneEventType } from "../api/awake-ai-atx";
import { ApiTimestamp, EventType } from "../model/timestamp";
import * as TimestampDAO from "../dao/timestamps";
import { DTDatabase, inDatabase } from "@digitraffic/common/dist/database/database";
import moment from "moment-timezone";
import { EventSource } from "../model/eventsource";
import { AwakeAiZoneType } from "../api/awake-common";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

export class AwakeAiATXService {
    private readonly api: AwakeAiATXApi;

    constructor(api: AwakeAiATXApi) {
        this.api = api;
    }

    async getATXs(timeoutMillis: number): Promise<ApiTimestamp[]> {
        const atxs = await this.api.getATXs(timeoutMillis);
        return inDatabase((db: DTDatabase) => {
            const promises = atxs
                .filter((atx) => atx.zoneType === AwakeAiZoneType.BERTH)
                .map(async (atx: AwakeAIATXTimestampMessage) => {
                    // pick the first supported LOCODE
                    if (atx.locodes.length > 1) {
                        logger.warn({
                            method: "AwakeAiATXService.getATXs",
                            message: `More than one locode for timestamp! IMO ${
                                atx.imo
                            } locodes ${JSON.stringify(atx.locodes)}`
                        });
                    } else if (!atx.locodes.length) {
                        logger.error({
                            method: "AwakeAiATXService.getATXs",
                            message: `No locode for timestamp! IMO ${atx.imo}`
                        });
                    }
                    const port = atx.locodes[0];
                    const eventType =
                        atx.zoneEventType === AwakeATXZoneEventType.ARRIVAL ? EventType.ATA : EventType.ATD;
                    const eventTime = moment(atx.eventTimestamp).toDate();
                    const portcallId = await TimestampDAO.findPortcallId(
                        db,
                        port,
                        eventType,
                        eventTime,
                        atx.mmsi,
                        atx.imo
                    );

                    if (portcallId) {
                        return {
                            eventType,
                            eventTime: atx.eventTimestamp,
                            recordTime: atx.eventTimestamp,
                            source: EventSource.AWAKE_AI,
                            ship: {
                                imo: atx.imo,
                                mmsi: atx.mmsi
                            },
                            location: {
                                port
                            },
                            portcallId
                        } as ApiTimestamp;
                    } else {
                        logger.warn({
                            method: "AwakeAiATXService.getATXs",
                            message: `no portcall found for ${atx.zoneEventType} IMO ${atx.imo}`
                        });
                        return null;
                    }
                });
            return Promise.all(promises).then(
                (timestamps) => timestamps.filter((timestamp) => !!timestamp) as ApiTimestamp[]
            );
        });
    }
}
