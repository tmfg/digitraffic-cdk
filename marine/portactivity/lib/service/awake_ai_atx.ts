import {AwakeAiATXApi, AwakeATXZoneEventType} from "../api/awake_ai_atx";
import {ApiTimestamp, EventType} from "../model/timestamp";
import * as TimestampDAO from '../db/timestamps';
import {Port} from "./portareas";
import {inDatabase} from "digitraffic-common/postgres/database";
import {IDatabase} from "pg-promise";
import moment from 'moment-timezone';
import {EventSource} from "../model/eventsource";

export class AwakeAiATXService {

    private readonly api: AwakeAiATXApi

    constructor(api: AwakeAiATXApi) {
        this.api = api;
    }

    async getATXs(ports: Port[], timeoutMillis: number): Promise<ApiTimestamp[]> {
        const atxs = await this.api.getATXs(timeoutMillis);

        return inDatabase(async (db: IDatabase<any, any>) => {

            const ret: ApiTimestamp[] = [];

            for (const atx of atxs.filter(atx => atx.locodes.some(locode => ports.includes(locode)))) {
                // pick the first supported LOCODE
                const port =  atx.locodes.find(locode => ports.includes(locode))!;
                const eventType = atx.zoneEventType == AwakeATXZoneEventType.ARRIVAL ? EventType.ATA : EventType.ATD;
                const eventTime = moment(atx.eventTimestamp).toDate();
                const portcallId = await TimestampDAO.findPortcallId(db,
                    port,
                    eventType,
                    eventTime,
                    atx.mmsi,
                    atx.imo);

                if (portcallId) {
                    ret.push({
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
                    });
                } else {
                    console.warn('method=getATXs no portcall found for %s IMO', atx.zoneEventType, atx.imo);
                }
            }

            return ret;
        });
    }
}
