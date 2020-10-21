import {DbETAShip} from '../db/db-estimates';
import {getETAs, ShipETA} from '../api/api-etas';
import {ApiEstimate, EventType} from '../model/estimate';
import {saveEstimates} from './estimates';
import {PortareaGeometry} from './portareas';

export async function updateETAEstimates(
    endpointClientId: string,
    endpointClientSecret: string,
    endpointClientAudience: string,
    endpointAuthUrl: string,
    endpointUrl: string,
    endpointSource: string,
    ships: DbETAShip[],
    portAreaGeometries: PortareaGeometry[]): Promise<ShipETA[]> {
    
    const etas = await getETAs(endpointClientId,
        endpointClientSecret,
        endpointClientAudience,
        endpointAuthUrl,
        endpointUrl,
        ships,
        portAreaGeometries);

    const estimates: ApiEstimate[] = etas.map(eta => ({
        eventType: EventType.ETA,
        eventTime: eta.eta,
        eventTimeConfidenceLower: null,
        eventTimeConfidenceUpper: null,
        recordTime: new Date().toISOString(),
        source: endpointSource,
        ship: {
            mmsi: eta.mmsi
        },
        location: {
            port: eta.locode
        },
        portcallId: null
    }));

    await saveEstimates(estimates);
    
    return etas;
}
