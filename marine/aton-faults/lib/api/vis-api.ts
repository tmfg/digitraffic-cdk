import axios from 'axios';
import {Agent} from 'https';

export async function uploadArea(
    faultS124: string,
    url: string,
    ca: string,
    clientCertificate: string,
    privateKey: string): Promise<void> {

    console.info(`method=uploadArea url=${url}`);

    // try-catch so axios won't log keys/certs
    try {
        const resp = await axios.post(url, faultS124, {
            httpsAgent: new Agent({
                ca,
                cert: clientCertificate,
                key: privateKey
            })
        });
        if (resp.status != 200) {
            console.error(`method=uploadArea returned status=${resp.status}, status text: ${resp.statusText}`);
            return Promise.reject();
        }
    } catch (error) {
        // can't log error without exposing keys/certs
        console.error('method=uploadArea unexpected error');
        return Promise.reject();
    }
}
