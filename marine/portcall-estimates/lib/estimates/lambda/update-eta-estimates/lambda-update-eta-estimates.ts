import {getEtas} from '../../api/api-etas';
import {getPortAreaGeometries} from '../../service/portareas';

const KEY_ENDPOINT_CLIENT_ID = 'ENDPOINT_CLIENT_ID'
const KEY_ENDPOINT_CLIENT_SECRET = 'ENDPOINT_CLIENT_SECRET'
const KEY_ENDPOINT_AUDIENCE = 'ENDPOINT_AUDIENCE'
const KEY_ENDPOINT_AUTH_URL = 'ENDPOINT_AUTH_URL'
const KEY_ENDPOINT_URL = 'ENDPOINT_URL'
const KEY_PORTAREA_LOCODES_CSV = 'PORTAREA_LOCODES'

export const handler = async (event: any): Promise<any> => {
    const endpointClientId = process.env[KEY_ENDPOINT_CLIENT_ID] as string;
    const endpointClientSecret = process.env[KEY_ENDPOINT_CLIENT_SECRET] as string;
    const endpointClientAudience = process.env[KEY_ENDPOINT_AUDIENCE] as string;
    const endpointAuthUrl = process.env[KEY_ENDPOINT_AUTH_URL] as string;
    const endpointUrl = process.env[KEY_ENDPOINT_URL] as string;
    const portAreaLocodes = (process.env[KEY_PORTAREA_LOCODES_CSV] as string).split(',');

    const portAreaGeometries = getPortAreaGeometries(portAreaLocodes);
    if (!portAreaGeometries) {
        throw new Error('Failed to fetch port area geometries!');
    }
    
    const etas = await getEtas(endpointClientId,
        endpointClientSecret,
        endpointClientAudience,
        endpointAuthUrl,
        endpointUrl,
        portAreaLocodes);

    if (!etas) {
        throw new Error('Failed to fetch ETAs!');
    }
};
