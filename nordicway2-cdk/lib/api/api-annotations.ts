import axios from 'axios';
import * as qs from 'querystring';
import {Annotation} from "../model/annotations";

export async function login(
    endpointUser: string,
    endpointPass: string,
    endpointUrl: string
) {
    console.info("logging to " + endpointUrl);

    const body = {
        username: endpointUser,
        password: endpointPass,
        hashed: ''
    };
    const form = qs.stringify(body);
    const resp = await axios.post(endpointUrl, form, {
        headers: {
            'accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    if (resp.status != 200) {
        throw Error('Login failed: ' + resp.statusText);
    }
    return resp.data;
}

export async function getAnnotations(
    userId: string,
    authToken: string,
    endpointUrl: string,
    timestampFrom: Date,
    timestampTo: Date): Promise<Annotation[]> {
    const fromString = getDateString(timestampFrom);
    const toString = getDateString(timestampTo)
    const annotations = [];

    let url = `${endpointUrl}?date_from_created=${fromString}&date_to_created=${toString}&client_id=c65fd29cd845035329ee4cd0&limit=100`;

    do {
        console.info("getting annotations from " + url);
        const resp = await getAnnotationsFromServer(url, userId, authToken);

        if (resp.status != 200) {
            throw Error('Fetching annotations failed: ' + resp.statusText);
        }


//        console.info("data " + JSON.stringify(resp.data));
//        console.info("headers " + JSON.stringify(resp.headers.link));

        // add all items from array to annotations-array
        annotations.push(...resp.data);

        url = getNextUrl(resp.headers);
    } while(url != null)

    return annotations;
}

function getNextUrl(headers: any) {
    const parse = require('parse-link-header');

    if(headers.link == null) {
        return null;
    }

    const parsedHeaders = parse(headers.link);

//    console.info("parsed " + JSON.stringify(parsedHeaders));

    if(parsedHeaders == null || parsedHeaders.cursornext == null) {
        return null;
    }

    return parsedHeaders.cursornext.url;
}

export async function getAnnotationsFromServer(url: string, userId: string, authToken: string) {
    const start = Date.now();

    return await axios.get(url, {
        headers: {
            'Accept': 'application/json',
            'X-User-Id': userId,
            'X-Auth-Token': authToken
        }
    }).then(a => {
        const end = Date.now();
        console.info("method=getAnnotationsFromServer annotationsCount=%d tookMs=%d", a.data.length, (end-start));
        return a;
    });
}

function getDateString(date: Date) {
    return date.toISOString();
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