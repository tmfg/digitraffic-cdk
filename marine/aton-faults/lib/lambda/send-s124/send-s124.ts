import {SNSEvent} from "aws-lambda";
import * as FaultsService from "../../service/faults";
import * as WarningsService from "../../service/warnings";
import * as S124Converter from "../../service/s124-converter";
import {sendFault, sendWarning} from "../../service/vis-sender";
import {SecretFunction, withDbSecret} from "digitraffic-common/secrets/dbsecret";
import {SECRET_ID} from "digitraffic-common/model/lambda-environment";
import {S124Type, SendS124Event} from "../../model/upload-voyageplan-event";
import {AtonSecret} from "../../model/secret";
import {decodeBase64ToAscii} from "digitraffic-common/js/js-utils";

let clientCertificate: string;
let privateKey: string;
let caCert: string;

const secretId = process.env[SECRET_ID] as string;

/**
 * This handler should only receive and send a single S124-message
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
        const snsEvent = JSON.parse(event.Records[0].Sns.Message) as SendS124Event;

        return handleEvent(snsEvent);
    };
}

async function handleEvent(event: SendS124Event) {
    if (event.type === S124Type.FAULT) {
        const faultS124 = await FaultsService.getFaultS124ById(event.id);
        if (faultS124) {
            await sendFault(faultS124, event.callbackEndpoint, caCert, clientCertificate, privateKey);
        } else {
            console.warn('Fault with id %d was not found', event.id);
        }
    } else if (event.type === S124Type.WARNING) {
        const warning = await WarningsService.findWarning(event.id);
        if(warning) {
            const xml = S124Converter.convertWarning(warning);

            await sendWarning(xml, event.callbackEndpoint, caCert, clientCertificate, privateKey);
        } else {
            console.warn('Warning with id %s was not found', event.id);
        }
    }

}

export const handler = handlerFn(withDbSecret);
