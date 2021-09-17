import {SNSEvent} from "aws-lambda";
import {getFaultS124ById} from "../../service/faults";
import {sendFault} from "../../service/fault-sender";
import {SecretFunction, withDbSecret} from "digitraffic-common/secrets/dbsecret";
import {AtonEnvKeys} from "../../keys";

let clientCertificate: string;
let privateKey: string;
let caCert: string;

const secretId = process.env[AtonEnvKeys.SECRET_ID] as string;

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

type AtonSecret = {
    readonly certificate: string,
    readonly privatekey: string,
    readonly ca: string
}

/**
 * This handler should only receive and send a single fault
 */
export function handlerFn(doWithSecret: SecretFunction) {
    return async (event: SNSEvent): Promise<void> => {
        if (!clientCertificate || !privateKey) {
            await doWithSecret(secretId, (secret: AtonSecret) => {
                // certificates are stored as base64 to prevent Secrets Manager from stripping line breaks
                clientCertificate = decodeBase64(secret.certificate);
                privateKey = decodeBase64(secret.privatekey);
                caCert = decodeBase64(secret.ca);
            }, {
                prefix: 'aton'
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
