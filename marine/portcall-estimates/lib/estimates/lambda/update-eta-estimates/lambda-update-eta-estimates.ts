import {getPortAreaGeometries} from '../../service/portareas';
import {findETAShipsByLocode} from '../../service/estimates';
import {updateETAEstimates} from '../../service/etas';
import {SNS} from 'aws-sdk';

export const KEY_ENDPOINT_CLIENT_ID = 'ENDPOINT_CLIENT_ID'
export const KEY_ENDPOINT_CLIENT_SECRET = 'ENDPOINT_CLIENT_SECRET'
export const KEY_ENDPOINT_AUDIENCE = 'ENDPOINT_AUDIENCE'
export const KEY_ENDPOINT_AUTH_URL = 'ENDPOINT_AUTH_URL'
export const KEY_ENDPOINT_URL = 'ENDPOINT_URL'
export const KEY_ESTIMATE_SOURCE = 'ESTIMATE_SOURCE'
export const KEY_ESTIMATE_SNS_TOPIC_ARN = 'ESTIMATE_SNS_TOPIC_ARN';

const endpointClientId = process.env[KEY_ENDPOINT_CLIENT_ID] as string;
const endpointClientSecret = process.env[KEY_ENDPOINT_CLIENT_SECRET] as string;
const endpointClientAudience = process.env[KEY_ENDPOINT_AUDIENCE] as string;
const endpointAuthUrl = process.env[KEY_ENDPOINT_AUTH_URL] as string;
const endpointUrl = process.env[KEY_ENDPOINT_URL] as string;
const endpointSource = process.env[KEY_ESTIMATE_SOURCE] as string;
const snsTopicArn = process.env[KEY_ESTIMATE_SNS_TOPIC_ARN] as string;

const portAreaGeometries = getPortAreaGeometries();
const locodes = portAreaGeometries.map(p => p.locode);

export const handler = async (): Promise<any> => {
    const ships = await findETAShipsByLocode(locodes);

    if (ships.length) {
        console.log('About to fetch ETAs for ships:', ships);
        const etas = await updateETAEstimates(endpointClientId,
            endpointClientSecret,
            endpointClientAudience,
            endpointAuthUrl,
            endpointUrl,
            endpointSource,
            ships,
            portAreaGeometries);

        await new SNS().publish({
            Message: JSON.stringify(etas.map(eta => ({
                ship_mmsi: eta.mmsi,
                ship_imo: eta.imo,
                location_locode: eta.locode,
                portcall_id: eta.portcall_id
            }))),
            TopicArn: snsTopicArn
        }).promise();
    } else {
        console.log('No ships for ETA update');
    }
};
