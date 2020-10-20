import axios from 'axios';
import {PortareaGeometry} from "../service/portareas";
import {DbETAShip} from "../db/db-estimates";

async function createEtaOAuthToken(
    endpointClientId: string,
    endpointClientSecret: string,
    endpointApiAudience: string,
    endpointAuthUrl: string
): Promise<OAuthTokenResponse> {

    const start = Date.now();

    // Try-catch because axios logs credentials
    try {
        const resp = await axios.post(endpointAuthUrl, {
            client_id: endpointClientId,
            client_secret: endpointClientSecret,
            audience: endpointApiAudience,
            grant_type: 'client_credentials'
        });
        if (resp.status != 200) {
            console.error(`method=createEtaOAuthToken returned status ${resp.status}`);
            return Promise.reject();
        }
        return Promise.resolve(resp.data);
    } catch (error) {
        console.error('method=createEtaOAuthToken login failed');
        return Promise.reject();
    } finally {
        console.log(`method=createEtaOAuthToken tookMs=${Date.now() - start}`)
    }
}

export async function getEtas(
    endpointClientId: string,
    endpointClientSecret: string,
    endpointClientAudience: string,
    endpointAuthUrl: string,
    endpointUrl: string,
    ships: DbETAShip[],
    portAreaGeometries: PortareaGeometry[]): Promise<any> {

    const start = Date.now();

    const token = await createEtaOAuthToken(
        endpointClientId,
        endpointClientSecret,
        endpointClientAudience,
        endpointAuthUrl);

    if (!token) {
        throw new Error('Authentication to ETA API failed!');
    }

    return Promise.all(await ships.map( ship =>
        getETA(endpointUrl,
            token.access_token,
            ship,
            portAreaGeometries.find(g => g.locode == ship.locode))))
        .then(a => {
            console.log(`method=getEtas tookMs=${Date.now() - start}`);
            return a;
        });
}

async function getETA(
    endpointUrl: string,
    token: string,
    ship: DbETAShip,
    portAreaGeometry?: PortareaGeometry): Promise<ETAsResponse> {

    if (!portAreaGeometry) {
        console.error(`method=getETA port area geometry for ship ${ship.imo} locode ${ship.locode} not found!`);
        return Promise.reject();
    }

    const resp = await axios.get(`${endpointUrl}?imo=${ship.imo}&destination_lat=${portAreaGeometry.latitude}&destination_lon=${portAreaGeometry.longitude}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    if (resp.status != 200) {
        console.error(`method=getETAs returned status: ${resp.status}`);
        return Promise.reject();
    }
    return Promise.resolve(resp.data);
}

interface OAuthTokenResponse {
    readonly access_token: string
    readonly token_type: string
    readonly expires_in: number
}

interface ETAsResponse {
    readonly features: [
        {
            readonly properties: {
                readonly vessel: {
                    readonly mmsi: number
                    readonly time: string
                    readonly speed: number
                    readonly heading: number
                    readonly position: {
                        readonly latitude: number
                        readonly longitude: number
                    }
                }
                readonly destination: {
                    readonly eta: string
                    readonly total_duration: string
                    readonly historical_duration: string
                    readonly synthetic_duration: string
                    readonly straight_duration: string
                }
                readonly crosspoint: {
                    readonly eta: string
                    readonly total_duration: string
                    readonly historical_duration: string
                    readonly synthetic_duration: string
                    readonly straight_duration: string
                }
            }
        }
    ]
}
