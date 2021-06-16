import {DbETAShip} from '../db/timestamps';
import {getETAs, ShipETA} from '../api/etas';
import {ApiTimestamp, EventType, validateTimestamp} from '../model/timestamp';
import {saveTimestamps} from './timestamps';
import {Port} from './portareas';
import {EventSource} from "../model/eventsource";

export async function updateETATimestamps(
    endpointClientId: string,
    endpointClientSecret: string,
    endpointClientAudience: string,
    endpointAuthUrl: string,
    endpointUrl: string,
    ships: DbETAShip[],
    portAreaGeometries: Port[]): Promise<ShipETA[]> {
    
    const etas = await getETAs(endpointClientId,
        endpointClientSecret,
        endpointClientAudience,
        endpointAuthUrl,
        endpointUrl,
        ships,
        portAreaGeometries);

    const etaToTimestampWithSource = etaToTimestamp(EventSource.VTS);
    const timestamps: ApiTimestamp[] = etas
        .map(etaToTimestampWithSource)
        .filter(validateTimestamp);

    await saveTimestamps(timestamps);

    return etas;
}

export function etaToTimestamp(endpointSource: string): (eta: ShipETA) => ApiTimestamp {
    return (eta: ShipETA): ApiTimestamp => ({
        eventType: EventType.ETA,
        eventTime: eta.eta,
        eventTimeConfidenceLower: null,
        eventTimeConfidenceUpper: null,
        recordTime: new Date().toISOString(),
        source: endpointSource,
        ship: {
            mmsi: eta.mmsi,
            imo: eta.imo
        },
        location: {
            port: eta.locode,
            portArea: eta.portArea
        },
        portcallId: eta.portcall_id
    });
}
