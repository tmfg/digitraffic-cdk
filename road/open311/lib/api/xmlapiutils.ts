import axios from 'axios';
import * as util from 'util';
import * as xml2js from 'xml2js';

export async function getXml<T>(
    endpointUser: string,
    endpointPass: string,
    endpointUrl: string,
    path: string
): Promise<T> {
    const resp = await axios.get(`${endpointUrl}${path}`, {
        headers: {
            'Accept': 'application/xml'
        },
        auth: {
            username: endpointUser,
            password: endpointPass
        }
    });
    if (resp.status != 200) {
        console.error(`method=getXml query to ${path} failed status ${resp.status}`);
        throw Error(`Query to ${path} failed`);
    }
    const parse = util.promisify(xml2js.parseString);
    return <T> await parse(resp.data);
}
