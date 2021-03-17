import {SNSEvent} from "aws-lambda";
import {getFaultS124ById} from "../../service/faults";
import {sendFault} from "../../service/fault-sender";
import {withDbSecret} from "../../../../../common/secrets/dbsecret";

let clientCertificate: string;
let privateKey: string;

export const KEY_SECRET_ID = 'SECRET_ID'
export const KEY_CA_SECRETKEY = 'CA_SECRETKEY'
export const KEY_CLIENT_CERTIFICATE_SECRETKEY = 'CLIENT_CERTIFICATE_SECRETKEY'
export const KEY_PRIVATE_KEY_SECRETKEY = 'PRIVATE_KEY_SECRETKEY'

const secretId = process.env[KEY_SECRET_ID] as string;
const caSecretKey = process.env[KEY_CA_SECRETKEY] as string;
const clientCertificateSecretKey = process.env[KEY_CLIENT_CERTIFICATE_SECRETKEY] as string;
const privateKeySecretKey = process.env[KEY_PRIVATE_KEY_SECRETKEY] as string;

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
                clientCertificate = secret[clientCertificateSecretKey];
                privateKey = secret[privateKeySecretKey];
            });
        }
        const snsEvent = JSON.parse(event.Records[0].Sns.Message) as SendFaultEvent;
        const faultS124 = await getFaultS124ById(snsEvent.faultId);
        await sendFault(faultS124, snsEvent.callbackEndpoint, caSecretKey, clientCertificate, privateKey);
    };
}

export const handler = handlerFn(withDbSecret);
