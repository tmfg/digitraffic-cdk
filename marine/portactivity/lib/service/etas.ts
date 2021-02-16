import {DbETAShip} from '../db/db-timestamps';
import {getETAs, ShipETA} from '../api/api-etas';
import {ApiTimestamp, EventType} from '../model/timestamp';
import {saveTimestamps} from './timestamps';
import {Port} from './portareas';

export async function updateETATimestamps(
    endpointClientId: string,
    endpointClientSecret: string,
    endpointClientAudience: string,
    endpointAuthUrl: string,
    endpointUrl: string,
    endpointSource: string,
    ships: DbETAShip[],
    portAreaGeometries: Port[]): Promise<ShipETA[]> {
    
    const etas = await getETAs(endpointClientId,
        endpointClientSecret,
        endpointClientAudience,
        endpointAuthUrl,
        endpointUrl,
        ships,
        portAreaGeometries);

    const etaToTimestampWithSource = etaToTimestamp(endpointSource);
    const timestamps: ApiTimestamp[] = etas.map(etaToTimestampWithSource);

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
