import {SNSEvent} from "aws-lambda";
import * as FaultsService from "../../service/faults";
import * as WarningsService from "../../service/warnings";
import * as S124Converter from "../../service/s124-converter";
import {VisService} from "../../service/vis";
import {SecretFunction, withDbSecret} from "digitraffic-common/secrets/dbsecret";
import {SECRET_ID} from "digitraffic-common/model/lambda-environment";
import {S124Type, SendS124Event} from "../../model/upload-voyageplan-event";
import {AtonSecret} from "../../model/secret";
import {decodeBase64ToAscii} from "digitraffic-common/js/js-utils";

let visService: VisService;

const secretId = process.env[SECRET_ID] as string;

/**
 * This handler should only receive and send a single S124-message
 */
export function handlerFn(doWithSecret: SecretFunction) {
    return async (event: SNSEvent): Promise<void> => {
        if (!visService) {
            await doWithSecret(secretId, (secret: AtonSecret) => {
                // certificates are stored as base64 to prevent Secrets Manager from stripping line breaks

                const clientCertificate = decodeSecretValue(secret.certificate);
                const privateKey = decodeSecretValue(secret.privatekey);
                const caCert = decodeSecretValue(secret.ca);
                visService = new VisService(caCert, clientCertificate, privateKey);
            }, {
                prefix: 'aton'
            });
        }
        const snsEvent = JSON.parse(event.Records[0].Sns.Message) as SendS124Event;

        return handleEvent(snsEvent);
    };
}

    function decodeSecretValue(value: string) {
        // for tests, no need to inject base64-stuff into secret
        if(!value) {
            return "";
        }

        return decodeBase64ToAscii(value);
    }

async function handleEvent(event: SendS124Event) {
    if (event.type === S124Type.FAULT) {
        const faultS124 = await FaultsService.getFaultS124ById(event.id);
        if (faultS124) {
            await visService.sendFault(faultS124, event.callbackEndpoint);
        } else {
            console.warn('Fault with id %d was not found', event.id);
        }
    } else if (event.type === S124Type.WARNING) {
        const warning = await WarningsService.findWarning(event.id);
        if(warning) {
            const xml = S124Converter.convertWarning(warning);

            await visService.sendWarning(xml, event.callbackEndpoint);
        } else {
            console.warn('Warning with id %s was not found', event.id);
        }
    }

}

export const handler = handlerFn(withDbSecret);
