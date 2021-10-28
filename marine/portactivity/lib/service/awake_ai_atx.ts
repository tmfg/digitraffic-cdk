import {AwakeAiATXApi, AwakeAiATXZoneType, AwakeATXZoneEventType} from "../api/awake_ai_atx";
import {ApiTimestamp, EventType} from "../model/timestamp";
import * as TimestampDAO from '../db/timestamps';
import {inDatabase} from "digitraffic-common/postgres/database";
import {IDatabase} from "pg-promise";
import moment from 'moment-timezone';
import {EventSource} from "../model/eventsource";

export class AwakeAiATXService {

    private readonly api: AwakeAiATXApi

    constructor(api: AwakeAiATXApi) {
        this.api = api;
    }

    async getATXs(timeoutMillis: number): Promise<ApiTimestamp[]> {
        const atxs = await this.api.getATXs(timeoutMillis);
        return inDatabase(async (db: IDatabase<any, any>) => {
            const promises = atxs
                .filter(atx => atx.zoneType === AwakeAiATXZoneType.BERTH)
                .map(async (atx) => {
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
                            timestamp: {
                                eventType,
                                eventTime: atx.eventTimestamp,
                                source: EventSource.AWAKE_AI,
                                recordTime: atx.eventTimestamp,
                                ship: {
                                    imo: atx.imo,
                                    mmsi: atx.mmsi
                                },
                                location: {
                                    port
                                },
                                portcallId
                            }
                        };
                    } else {
                        console.warn('method=getATXs no portcall found for %s IMO', atx.zoneEventType, atx.imo);
                        return {
                            timestamp: null
                        };
                    }
                });
            return Promise.all(promises)
                .then(atxs => atxs.filter(atx => !!atx.timestamp).map(atx => atx.timestamp));
        });
    }
}
