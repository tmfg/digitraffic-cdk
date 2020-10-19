import axios from 'axios';
import {PortareaGeometry} from "../service/portareas";

export async function getEtas(
    endpointClientId: string,
    endpointClientSecret: string,
    endpointClientAudience: string,
    endpointAuthUrl: string,
    endpointUrl: string,
    portAreaGeometries: PortareaGeometry[]): Promise<any> {

    const token = await createEtaOAuthToken(
        endpointClientId,
        endpointClientSecret,
        endpointClientAudience,
        endpointAuthUrl);

    if (!token) {
        throw new Error('Authentication to ETA API failed!');
    }

    const etas = await getETAs(endpointUrl, token.access_token, portAreaGeometries);

    if (!etas) {
        throw new Error('Fetching ETAs failed!');
    }
}

async function createEtaOAuthToken(
    endpointClientId: string,
    endpointClientSecret: string,
    endpointApiAudience: string,
    endpointAuthUrl: string
): Promise<OAuthTokenResponse> {

    const resp = await axios.post(endpointAuthUrl, {
        headers: {
            'Content-Type': 'application/json'
        },
        data: {
            client_id: endpointClientId,
            client_secret: endpointClientSecret,
            audience: endpointApiAudience,
            grant_type: 'client_credentials'
        }
    });
    if (resp.status != 200) {
        console.error(`method=createEtaOAuthToken returned status ${resp.status}`);
        return Promise.reject();
    }
    return Promise.resolve(resp.data);
}

async function getETAs(
    endpointUrl: string,
    token: string,
    portAreaGeometries: PortareaGeometry[]): Promise<ETAsResponse> {

    const resp = await axios.get(endpointUrl, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    if (resp.status != 200) {
        console.error(`method=getETAs returned status ${resp.status}`);
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
