import axios from 'axios';

export async function login(
    endpointUser: string,
    endpointPass: string,
    endpointUrl: string
) {
    const resp = await axios.get(endpointUrl, {
        headers: {
            'Accept': 'application/json'
        },
        auth: {
            username: endpointUser,
            password: endpointPass
        }
    });

    if (resp.status != 200) {
        throw Error('Fetching annotations failed: ' + resp.statusText);
    }
    return resp.data;
}

export async function getAnnotations(
    userId: string,
    authToken: string,
    endpointUrl: string
) {
    const url = endpointUrl + 'date_from_created=2019-12-10T00%3A00%3A00.000Z&client_id=c65fd29cd845035329ee4cd0';

    const resp = await axios.get(url, {
        headers: {
            'Accept': 'application/json',
            'X-User-Id': userId,
            'X-Auth-Token': authToken
        }
    });

    if (resp.status != 200) {
        throw Error('Fetching annotations failed: ' + resp.statusText);
    }
    return resp.data;
}

// properties deserialized as singleton arrays
export interface LoginResponse {
    readonly status: string;
    readonly data: LoginResponseData;
}

export interface LoginResponseData {
    readonly authToken: string;
    readonly userId: string;
}