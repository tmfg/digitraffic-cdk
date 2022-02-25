import axios from 'axios';

export async function getXml(apiUrl: string,
    path: string,
    authKey: string): Promise<string> {
    const resp = await axios.get(`${apiUrl}${path}?authKey=${authKey}`, {
        headers: {
            'Accept': 'application/xml',
        },
    });
    if (resp.status !== 200) {
        console.error(`method=getXml query to ${path} failed status ${resp.status}`);
        throw Error(`Query to ${path} failed`);
    }
    return resp.data;
}
