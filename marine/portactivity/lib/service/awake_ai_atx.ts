import {AwakeAiATXApi, AwakeAIATXTimestampMessage, AwakeATXZoneEventType} from "../api/awake_ai_atx";
import {ApiTimestamp, EventType} from "../model/timestamp";
import * as TimestampDAO from '../db/timestamps';
import {DTDatabase, inDatabase} from "digitraffic-common/postgres/database";
import moment from 'moment-timezone';
import {EventSource} from "../model/eventsource";
import {AwakeAiZoneType} from "../api/awake_common";

export class AwakeAiATXService {

    private readonly api: AwakeAiATXApi

    constructor(api: AwakeAiATXApi) {
        this.api = api;
    }

    async getATXs(timeoutMillis: number): Promise<ApiTimestamp[]> {
        const atxs = await this.api.getATXs(timeoutMillis);
        return inDatabase(async (db: DTDatabase) => {
            const promises = atxs
                .filter(atx => atx.zoneType === AwakeAiZoneType.BERTH)
                .map(async (atx: AwakeAIATXTimestampMessage) => {
                    // pick the first supported LOCODE
                    if (atx.locodes.length > 1) {
                        console.warn('method=getATXs More than one locode for timestamp! IMO %s locodes %s', atx.imo, atx.locodes);
                    } else if (!atx.locodes.length) {
                        console.error('method=getATXs No locode for timestamp! IMO %s', atx.imo);
                    }
                    const port =  atx.locodes[0];
                    const eventType = atx.zoneEventType == AwakeATXZoneEventType.ARRIVAL ? EventType.ATA : EventType.ATD;
                    const eventTime = moment(atx.eventTimestamp).toDate();
                    const portcallId = await TimestampDAO.findPortcallId(db,
                        port,
                        eventType,
                        eventTime,
                        atx.mmsi,
                        atx.imo);

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
                        console.warn('method=getATXs no portcall found for %s IMO', atx.zoneEventType, atx.imo);
                        return null;
                    }
                });
            return Promise.all(promises)
                .then(timestamps => timestamps.filter(timestamp => timestamp != null).map(timestamp => timestamp as ApiTimestamp));
        });
    }
}
