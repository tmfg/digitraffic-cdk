import {SNSEvent} from "aws-lambda";
import {getFaultS124ById} from "../../service/faults";
import {sendFault} from "../../service/vis-sender";
import {SecretFunction, withDbSecret} from "digitraffic-common/secrets/dbsecret";
import {SECRET_ID} from "digitraffic-common/model/lambda-environment";
import {SendFaultEvent} from "../../model/upload-voyageplan-event";
import {AtonSecret} from "../../model/secret";
import {decodeBase64ToAscii} from "digitraffic-common/js/js-utils";

let clientCertificate: string;
let privateKey: string;
let caCert: string;

const secretId = process.env[SECRET_ID] as string;

/**
 * This handler should only receive and send a single fault
 */
export function handlerFn(doWithSecret: SecretFunction) {
    return async (event: SNSEvent): Promise<void> => {
        if (!clientCertificate || !privateKey) {
            await doWithSecret(secretId, (secret: AtonSecret) => {
                // certificates are stored as base64 to prevent Secrets Manager from stripping line breaks
                clientCertificate = decodeBase64ToAscii(secret.certificate);
                privateKey = decodeBase64ToAscii(secret.privatekey);
                caCert = decodeBase64ToAscii(secret.ca);
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

export const handler = handlerFn(withDbSecret);
