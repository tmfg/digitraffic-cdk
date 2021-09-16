import {SNSEvent} from "aws-lambda";
import {getFaultS124ById} from "../../service/faults";
import {sendFault} from "../../service/fault-sender";
import {withDbSecret} from "digitraffic-common/secrets/dbsecret";
import {AtonEnvKeys} from "../../keys";

let clientCertificate: string;
let privateKey: string;
let caCert: string;

const secretId = process.env[AtonEnvKeys.SECRET_ID] as string;
const caSecretKey = process.env[AtonEnvKeys.CA_SECRETKEY] as string;
const clientCertificateSecretKey = process.env[AtonEnvKeys.CLIENT_CERTIFICATE_SECRETKEY] as string;
const privateKeySecretKey = process.env[AtonEnvKeys.PRIVATE_KEY_SECRETKEY] as string;

export interface SendFaultEvent {
    /**
     * Endpoint URL for callback
     */
    readonly callbackEndpoint: string

    /**
     * Fault id
     */
    readonly faultId: number
}

/**
 * This handler should only receive and send a single fault
 */
export function handlerFn(doWithSecret: (secretId: string, fn: (secret: any) => any) => any) {
    return async (event: SNSEvent): Promise<void> => {
        if (!clientCertificate || !privateKey) {
            await doWithSecret(secretId, (secret: any) => {
                // certificates are stored as base64 to prevent Secrets Manager from stripping line breaks
                clientCertificate = decodeBase64(secret[clientCertificateSecretKey]);
                privateKey = decodeBase64(secret[privateKeySecretKey]);
                caCert = decodeBase64(secret[caSecretKey]);
            });
        }
        const snsEvent = JSON.parse(event.Records[0].Sns.Message) as SendFaultEvent;
        const faultS124 = await getFaultS124ById(snsEvent.faultId);
        if (faultS124) {
            await sendFault(faultS124, snsEvent.callbackEndpoint, caCert, clientCertificate, privateKey);
        } else {
            console.warn('Fault with id %d was not found', snsEvent.faultId);
        }
    };
}

function decodeBase64(str: string) {
    return new Buffer(str, 'base64').toString('ascii');
}

export const handler = handlerFn(withDbSecret);
