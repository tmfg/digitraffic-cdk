/**
 * This API Gateway authorizer requires mutual TLS to be enabled on the API Gateway.
 */

import {withSecret} from "../../../../../common/secrets/secret";
import axios from 'axios';
const asn1 = require('asn1js');
const pkijs = require('pkijs');
const pvutils = require('pvutils');
const NodeCache = require('node-cache');

export const KEY_SECRET_ID = 'SECRET_ID';
export const KEY_CRL_URL_SECRETKEY = 'KEY_CRL_URL';

const secretId = process.env[KEY_SECRET_ID] as string;
const crlUrlSecretKey = process.env[KEY_CRL_URL_SECRETKEY] as string;

const crlCache = new NodeCache({
    stdTTL: 300 // 5 minutes in seconds
});
const CRL_CACHE_KEY = 'crl';

/**
 *  Use certificate revocation list (CRL) to check if client certificate is revoked
 */
export async function handler(event: any, _: any, callback: any) {
    return await withSecret(secretId, async (secret: any) => {
        let crlData = crlCache.get(CRL_CACHE_KEY);
        if (!crlData) {
            console.info('CRL was not in cache, refreshing')
            const newCrlData = await getCrlData(secret[crlUrlSecretKey] as string);
            crlData = newCrlData.replace(/(-----(BEGIN|END) X509 CRL-----|[\n\r])/g, '');
            crlCache.set(CRL_CACHE_KEY, crlData);
        }

        const crl = buildCrl(crlData);

        const clientCertPem = event.requestContext.identity.clientCert.clientCertPem;
        const pkiCert = buildCert(clientCertPem.replace(/(-----(BEGIN|END) CERTIFICATE-----|[\n\r])/g, ''));
        const serial = pvutils.bufferToHexCodes(pkiCert.serialNumber.valueBlock.valueHex)

        for (const { userCertificate } of crl.revokedCertificates) {
            if (pvutils.bufferToHexCodes(userCertificate.valueBlock.valueHex) === serial) {
                return callback(null, generateDeny('principal', event.methodArn))
            }
        }
        callback(null, generateAllow('principal', event.methodArn));
    });
}

async function getCrlData(crlUrl: string): Promise<string> {
    const res = await axios.get(crlUrl);
    return res.data;
}

function buildCrl(crlData: string): any {
    const buf = Buffer.from(crlData, 'base64');
    const ber = new Uint8Array(buf).buffer;

    const asn1crl = asn1.fromBER(ber);
    return new pkijs.CertificateRevocationList({
        schema: asn1crl.result
    });
}

function buildCert(cert: string): any {
    const certBuf = Buffer.from(cert, 'base64');
    const certBer = new Uint8Array(certBuf).buffer;
    const asn1Cert = asn1.fromBER(certBer);
    return new pkijs.Certificate({
        schema: asn1Cert.result
    });
}

function generatePolicy(principalId: any, effect: any, resource: any) {
    const authResponse: any = {};
    authResponse.principalId = principalId;
    if (effect && resource) {
        const policyDocument: any = {};
        policyDocument.Version = '2012-10-17'; // default version
        policyDocument.Statement = [];
        const statementOne: any = {};
        statementOne.Action = 'execute-api:Invoke'; // default action
        statementOne.Effect = effect;
        statementOne.Resource = resource;
        policyDocument.Statement[0] = statementOne;
        authResponse.policyDocument = policyDocument;
    }
    return authResponse;
}

function generateAllow(principalId: any, resource: any): any {
    return generatePolicy(principalId, 'Allow', resource);
}

function generateDeny(principalId: any, resource: any): any {
    return generatePolicy(principalId, 'Deny', resource);
}
