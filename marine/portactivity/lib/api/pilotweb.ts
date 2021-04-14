import axios from "axios";

const https = require('https');

const PILOTAGES_PATH = "/vts/active-pilotages";

export async function getMessages(host: string, token: string): Promise<any> {
    let content = '';

    const promise = new Promise((resolve, reject) => {
        https.request({
            host: host,
            path: PILOTAGES_PATH,
            method: 'GET',
            headers: {
                'Authorization': `Basic ${token}`,
                'Content-Type': 'text/plain'
            }
        }, (response: any) => {
            //another chunk of data has been received, so append it to `str`
            response.on('data', (chunk: any) => {
                content += chunk;
            });

            //the whole response has been received, so we just print it out here
            response.on('end', () => {
                resolve(content);
            });

            response.on('error', (error: any) => {
                reject(error);
            });
        }).end();
    });

    console.info("request done!");

    return await promise;
}

export async function getMessagesold(url: string, token: string): Promise<any> {
    const response = await axios.get(url, {
        headers: {
            'Authorization': `Basic ${token}`,
            'Content-Type': 'text/plain'
        },
        validateStatus: (status) => {
            console.info("validateStatus " + status);

            return true;
        }
    });

    console.info("response " + JSON.stringify(response));

    return JSON.parse(response.data);
}