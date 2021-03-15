import {uploadArea} from "../api/vis-api";

export async function sendFault(
    faultS124: string,
    url: string,
    clientCertificate: string,
    privateKey: string) {

    const start = Date.now();
    await uploadArea(faultS124, url, clientCertificate, privateKey);
    console.info(`method=sendFault tookMs=%d`, Date.now() - start);
}
