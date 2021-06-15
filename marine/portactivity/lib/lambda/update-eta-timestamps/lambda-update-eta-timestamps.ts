import {getPortAreaGeometries, Port} from '../../service/portareas';
import {findETAShipsByLocode} from '../../service/timestamps';
import {updateETATimestamps} from '../../service/etas';
import {DbETAShip} from "../../db/timestamps";
import {ShipETA} from "../../api/etas";
import {withDbSecret} from "digitraffic-common/secrets/dbsecret";
import {PortactivitySecretKeys} from "../../keys";

const portAreaGeometries = getPortAreaGeometries();
const locodes = portAreaGeometries.map(p => p.locode);

export function handlerFn(
    withDbSecretFn: (secretId: string, fn: (_: any) => Promise<void>, expectedKeys: string[]) => Promise<any>,
    doUpdateETATimestamps: (
        endpointClientId: string,
        endpointClientSecret: string,
        endpointClientAudience: string,
        endpointAuthUrl: string,
        endpointUrl: string,
        ships: DbETAShip[],
        portAreaGeometries: Port[]) => Promise<ShipETA[]>
): () => Promise<any> {

    return async () => {
        const expectedKeys = [
            PortactivitySecretKeys.ETAS_CLIENT_ID,
            PortactivitySecretKeys.ETAS_CLIENT_SECRET,
            PortactivitySecretKeys.ETAS_AUDIENCE,
            PortactivitySecretKeys.ETAS_URL,
            PortactivitySecretKeys.ETAS_AUTH_URL
        ];

        return withDbSecretFn(process.env.SECRET_ID as string, async (secret: any): Promise<any> => {

            const endpointClientId = secret[PortactivitySecretKeys.ETAS_CLIENT_ID] as string;
            const endpointClientSecret = secret[PortactivitySecretKeys.ETAS_CLIENT_SECRET] as string;
            const endpointClientAudience = secret[PortactivitySecretKeys.ETAS_AUDIENCE] as string;
            const endpointAuthUrl = secret[PortactivitySecretKeys.ETAS_AUTH_URL] as string;
            const endpointUrl = secret[PortactivitySecretKeys.ETAS_URL] as string;

            const ships = await findETAShipsByLocode(locodes, portAreaGeometries);

            if (ships.length) {
                console.log('About to fetch ETAs for ships:', ships);
                await doUpdateETATimestamps(
                    endpointClientId,
                    endpointClientSecret,
                    endpointClientAudience,
                    endpointAuthUrl,
                    endpointUrl,
                    ships,
                    portAreaGeometries);
            } else {
                console.log('No ships for ETA update    ');
            }
        }, expectedKeys);
    };
}

function checkSecretKey(key: string) {
    if (!key) {

    }
}

export const handler = handlerFn(withDbSecret, updateETATimestamps);