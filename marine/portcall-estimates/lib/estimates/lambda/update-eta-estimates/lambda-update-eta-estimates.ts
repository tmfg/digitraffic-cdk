import {getETAs} from '../../api/api-etas';
import {getPortAreaGeometries} from '../../service/portareas';
import {findETAShipsByLocode, saveEstimates} from '../../service/estimates';
import {ApiEstimate, EventType} from "../../model/estimate";
import {SNS} from "aws-sdk";

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

    if (ships.length) {
        console.log(`About to fetch ETAs for ${ships.length} ships`);
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

        await new SNS().publish({
            Message: JSON.stringify(etas.map(eta => ({
                ship_mmsi: eta.mmsi,
                ship_imo: eta.imo,
                location_locode: eta.locode
            }))),
            TopicArn: process.env.ESTIMATE_SNS_TOPIC_ARN
        }).promise();
    } else {
        console.log('No ships for ETA update');
    }
};
