import {getEtas} from '../../api/api-etas';
import {getPortAreaGeometries} from '../../service/portareas';
import {findETAShipsByLocode, saveEstimate} from '../../service/estimates';
import {ApiEstimate, EventType} from "../../model/estimate";

export const KEY_ENDPOINT_CLIENT_ID = 'ENDPOINT_CLIENT_ID'
export const KEY_ENDPOINT_CLIENT_SECRET = 'ENDPOINT_CLIENT_SECRET'
export const KEY_ENDPOINT_AUDIENCE = 'ENDPOINT_AUDIENCE'
export const KEY_ENDPOINT_AUTH_URL = 'ENDPOINT_AUTH_URL'
export const KEY_ENDPOINT_URL = 'ENDPOINT_URL'
export const KEY_ESTIMATE_SOURCE = 'ESTIMATE_SOURCE'

export const handler = async (): Promise<any> => {
    const endpointClientId = process.env[KEY_ENDPOINT_CLIENT_ID] as string;
    const endpointClientSecret = process.env[KEY_ENDPOINT_CLIENT_SECRET] as string;
    const endpointClientAudience = process.env[KEY_ENDPOINT_AUDIENCE] as string;
    const endpointAuthUrl = process.env[KEY_ENDPOINT_AUTH_URL] as string;
    const endpointUrl = process.env[KEY_ENDPOINT_URL] as string;
    const endpointSource = process.env[KEY_ESTIMATE_SOURCE] as string;

    const portAreaGeometries = getPortAreaGeometries();
    const locodes = portAreaGeometries.map(p => p.locode);
    const ships = await findETAShipsByLocode(locodes);

    const etas = await getEtas(endpointClientId,
        endpointClientSecret,
        endpointClientAudience,
        endpointAuthUrl,
        endpointUrl,
        ships,
        portAreaGeometries);


    await Promise.all(etas.map(eta => {
        const estimate: ApiEstimate = {
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
        };
        return saveEstimate(estimate);
    }));
};
