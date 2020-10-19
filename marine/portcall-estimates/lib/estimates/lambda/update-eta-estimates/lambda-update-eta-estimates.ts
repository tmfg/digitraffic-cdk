import {getEtas} from '../../api/api-etas';
import {getPortAreaGeometries} from '../../service/portareas';
import {findETAShipsByLocode} from '../../service/estimates';

export const KEY_ENDPOINT_CLIENT_ID = 'ENDPOINT_CLIENT_ID'
export const KEY_ENDPOINT_CLIENT_SECRET = 'ENDPOINT_CLIENT_SECRET'
export const KEY_ENDPOINT_AUDIENCE = 'ENDPOINT_AUDIENCE'
export const KEY_ENDPOINT_AUTH_URL = 'ENDPOINT_AUTH_URL'
export const KEY_ENDPOINT_URL = 'ENDPOINT_URL'

export const handler = async (event: any): Promise<any> => {
    const endpointClientId = process.env[KEY_ENDPOINT_CLIENT_ID] as string;
    const endpointClientSecret = process.env[KEY_ENDPOINT_CLIENT_SECRET] as string;
    const endpointClientAudience = process.env[KEY_ENDPOINT_AUDIENCE] as string;
    const endpointAuthUrl = process.env[KEY_ENDPOINT_AUTH_URL] as string;
    const endpointUrl = process.env[KEY_ENDPOINT_URL] as string;

    const portAreaGeometries = getPortAreaGeometries();
    const locodes = portAreaGeometries.map(p => p.locode);
    const ships = await findETAShipsByLocode(locodes);
    console.log('SHIPS', ships);

    const etas = await getEtas(endpointClientId,
        endpointClientSecret,
        endpointClientAudience,
        endpointAuthUrl,
        endpointUrl,
        portAreaGeometries);

    if (!etas) {
        throw new Error('Failed to fetch ETAs!');
    }
};
