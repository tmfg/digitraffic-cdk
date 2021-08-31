import {AwakeAiApi, AwakeAiETAShipStatus} from "../api/awake_ai";
import {DbETAShip} from "../db/timestamps";
import {ApiTimestamp, EventType} from "../model/timestamp";
import {EventSource} from "../model/eventsource";

export class AwakeAiService {

    private readonly api: AwakeAiApi

    constructor(api: AwakeAiApi) {
        this.api = api;
    }

    async getAwakeAiTimestamps(ships: DbETAShip[]): Promise<ApiTimestamp[]> {
        const ret: ApiTimestamp[] = [];

        for (const ship of ships) {
            try {
                console.info(`method=updateAwakeAiTimestamps getting ETA for port call id ${ship.portcall_id}`);
                const eta = await this.api.getETA(ship.imo);

                if (eta.status != AwakeAiETAShipStatus.UNDER_WAY) {
                    console.warn(`method=updateAwakeAiTimestamps ship is not under way, instead is ${eta.status}`);
                    continue;
                }

                if (!eta.predictedEta) {
                    console.warn('method=updateAwakeAiTimestamps no predicted ETA');
                    continue;
                }

                if (!eta.predictedDestination) {
                    console.warn('method=updateAwakeAiTimestamps no predicted locode');
                    continue;
                }

                if (eta.predictedDestination != ship.locode) {
                    console.warn(`method=updateAwakeAiTimestamps expected locode was ${ship.locode}, was ${eta.predictedDestination}, saving timestamp with predicted locode`);
                }

                if (!eta.timestamp) {
                    console.warn('method=updateAwakeAiTimestamps no ETA timestamp received, using current time');
                }

                ret.push({
                    ship: {
                        mmsi: eta.mmsi,
                        imo: eta.imo
                    },
                    location: {
                        port: eta.predictedDestination,
                        portArea: ship.port_area_code
                    },
                    source: EventSource.AWAKE_AI,
                    eventType: EventType.ETA,
                    eventTime: eta.predictedEta,
                    recordTime: eta.timestamp ?? new Date().toISOString(),
                    portcallId: ship.portcall_id
                });
            } catch (error) {
                console.error(`method=updateAwakeAiTimestamps error fetching ETA for port call ${ship.portcall_id}, error: ${error.message}`);
            }
        }
        return ret;
    }

}
