import * as VisApi from '../api/vis';

export async function sendFault(
    faultS124: string,
    url: string,
    ca: string,
    clientCertificate: string,
    privateKey: string): Promise<any> {

    const start = Date.now();
    await VisApi.uploadArea(faultS124, url, ca, clientCertificate, privateKey);
    console.info(`method=sendFault tookMs=%d`, Date.now() - start);
}

export async function sendWarnings(
    warningsS124: string,
    url: string,
    ca: string,
    clientCertificate: string,
    privateKey: string): Promise<any> {

    const start = Date.now();
    await VisApi.uploadArea(warningsS124, url, ca, clientCertificate, privateKey);
    console.info(`method=sendWarnings tookMs=%d`, Date.now() - start);
}
