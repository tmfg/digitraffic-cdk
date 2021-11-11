import * as FaultsService from "../../service/faults";
import * as WarningsService from "../../service/warnings";
import * as S124Converter from "../../service/s124-converter";
import {VisService} from "../../service/vis";
import {SecretFunction, withDbSecret} from "digitraffic-common/secrets/dbsecret";
import {SECRET_ID} from "digitraffic-common/model/lambda-environment";
import {S124Type, SendS124Event} from "../../model/upload-voyageplan-event";
import {AtonSecret} from "../../model/secret";
import {decodeBase64ToAscii} from "digitraffic-common/js/js-utils";
import {SQSEvent} from "aws-lambda";
import {inDatabaseReadonly} from "digitraffic-common/postgres/database";
import {IDatabase} from "pg-promise";

const middy = require('@middy/core')
const sqsPartialBatchFailureMiddleware = require('@middy/sqs-partial-batch-failure')

let visService: VisService;

const secretId = process.env[SECRET_ID] as string;

/**
 * This handler should only receive and send a single S124-message
 */
export function handlerFn(doWithSecret: SecretFunction) {
    return async (event: SQSEvent): Promise<any> => {
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

        return inDatabaseReadonly(async (db: IDatabase<any,any>) => {
            return Promise.allSettled(event.Records
                .map(r => JSON.parse(r.body) as SendS124Event)
                .map(event => handleEvent(db, event))
            );
        });
    };
}

    function decodeSecretValue(value: string) {
        // for tests, no need to inject base64-stuff into secret
        if(!value) {
            return "";
        }

        return decodeBase64ToAscii(value);
    }

async function handleEvent(db: IDatabase<any, any>, event: SendS124Event): Promise<any> {
    if (event.type === S124Type.FAULT) {
        const faultS124 = await FaultsService.getFaultS124ById(db, event.id);
        if (faultS124) {
            return await visService.sendFault(faultS124, event.callbackEndpoint);
        } else {
            console.warn('Fault with id %d was not found', event.id);
        }
    } else if (event.type === S124Type.WARNING) {
        const warning = await WarningsService.findWarning(db, event.id);
        if(warning) {
            const xml = S124Converter.convertWarning(warning);

            return await visService.sendWarning(xml, event.callbackEndpoint);
        } else {
            console.warn('Warning with id %s was not found', event.id);
        }
    }

    return Promise.reject();
}

export const handler = middy(handlerFn(withDbSecret)).use(sqsPartialBatchFailureMiddleware());
