import {getPortAreaGeometries, Port} from '../../service/portareas';
import {findETAShipsByLocode} from '../../service/timestamps';
import {updateETATimestamps} from '../../service/etas';
import {DbETAShip} from "../../db/timestamps";
import {ShipETA} from "../../api/etas";
import {withDbSecret} from "../../../../../common/secrets/dbsecret";

export const KEY_ENDPOINT_CLIENT_ID = 'ENDPOINT_CLIENT_ID'
export const KEY_ENDPOINT_CLIENT_SECRET = 'ENDPOINT_CLIENT_SECRET'
export const KEY_ENDPOINT_AUDIENCE = 'ENDPOINT_AUDIENCE'
export const KEY_ENDPOINT_AUTH_URL = 'ENDPOINT_AUTH_URL'
export const KEY_ENDPOINT_URL = 'ENDPOINT_URL'
export const KEY_ESTIMATE_SOURCE = 'ESTIMATE_SOURCE'

const endpointClientId = process.env[KEY_ENDPOINT_CLIENT_ID] as string;
const endpointClientSecret = process.env[KEY_ENDPOINT_CLIENT_SECRET] as string;
const endpointClientAudience = process.env[KEY_ENDPOINT_AUDIENCE] as string;
const endpointAuthUrl = process.env[KEY_ENDPOINT_AUTH_URL] as string;
const endpointUrl = process.env[KEY_ENDPOINT_URL] as string;
const endpointSource = process.env[KEY_ESTIMATE_SOURCE] as string;

const portAreaGeometries = getPortAreaGeometries();
const locodes = portAreaGeometries.map(p => p.locode);

export function handlerFn(
    withDbSecretFn: (secretId: string, fn: (_: any) => Promise<void>) => Promise<any>,
    doUpdateETATimestamps: (
        endpointClientId: string,
        endpointClientSecret: string,
        endpointClientAudience: string,
        endpointAuthUrl: string,
        endpointUrl: string,
        endpointSource: string,
        ships: DbETAShip[],
        portAreaGeometries: Port[]) => Promise<ShipETA[]>
): () => Promise<any> {

    return async () => {
        return withDbSecretFn(process.env.SECRET_ID as string, async (_: any): Promise<any> => {
            const ships = await findETAShipsByLocode(locodes, portAreaGeometries);

            if (ships.length) {
                console.log('About to fetch ETAs for ships:', ships);
                await doUpdateETATimestamps(endpointClientId,
                    endpointClientSecret,
                    endpointClientAudience,
                    endpointAuthUrl,
                    endpointUrl,
                    endpointSource,
                    ships,
                    portAreaGeometries);
            } else {
                console.log('No ships for ETA update');
            }
        });
    };
}

export const handler = handlerFn(withDbSecret, updateETATimestamps);