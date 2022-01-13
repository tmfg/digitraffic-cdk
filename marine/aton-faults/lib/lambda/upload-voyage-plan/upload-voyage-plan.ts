import * as util from 'util';
import * as xml2js from 'xml2js';
import {RtzVoyagePlan} from "digitraffic-common/marine/rtz";
import {SQS} from "aws-sdk";
import {SecretFunction, withDbSecret} from "digitraffic-common/aws/runtime/secrets/dbsecret";
import {BAD_REQUEST_MESSAGE} from "digitraffic-common/aws/types/errors";
import {AtonEnvKeys} from "../../keys";
import {VoyagePlanService} from "../../service/voyage-plan";
import {UploadVoyagePlanEvent} from "../../model/upload-voyageplan-event";
import {AtonSecret} from "../../model/secret";
import {decodeBase64ToAscii} from "digitraffic-common/utils/base64";
import {VisService} from "../../service/vis";

/**
 * Implementation for the Sea Traffic Management (STM) Voyage Information Service (VIS) uploadVoyagePlan interface.
 * https://www.seatrafficmanagement.info/developers-forum/vis/
 */

const secretId = process.env.SECRET_ID as string;
const sendS124QueueUrl = process.env[AtonEnvKeys.SEND_S124_QUEUE_URL] as string;

let visService: VisService;

export function handlerFn(sqs: SQS, doWithSecret: SecretFunction<AtonSecret>): (event: UploadVoyagePlanEvent) => Promise<void> {
    return async function(event: UploadVoyagePlanEvent): Promise<void> {
        if (!visService) {
            await doWithSecret(secretId, (secret: AtonSecret) => {
                const clientCertificate = decodeSecretValue(secret.certificate);
                const privateKey = decodeSecretValue(secret.privatekey);
                const caCert = decodeSecretValue(secret.ca);
                visService = new VisService(caCert, clientCertificate, privateKey, secret.serviceRegistryUrl);
            }, {
                prefix: 'aton',
            });
        }

        let voyagePlan: RtzVoyagePlan;
        try {
            console.info("DEBUG voyageplan " + event.voyagePlan);

            const parseXml = util.promisify(xml2js.parseString);
            voyagePlan = (await parseXml(event.voyagePlan)) as RtzVoyagePlan;
        } catch (error) {
            console.error('UploadVoyagePlan XML parsing failed', error);
            return Promise.reject(BAD_REQUEST_MESSAGE);
        }

        const endpoint = await getEndpointUrl(event, voyagePlan);
        //send faults to given callback endpoint, if present
        if (!endpoint) {
            console.info("no endpoint url!");
        } else {
            const vpService = new VoyagePlanService(sqs, endpoint, sendS124QueueUrl);
            return vpService.handleVoyagePlan(voyagePlan);
        }
    };
}

function decodeSecretValue(value: string) {
    // for tests, no need to inject base64-stuff into secret
    if (!value) {
        return "";
    }

    return decodeBase64ToAscii(value);
}

async function getEndpointUrl(event: UploadVoyagePlanEvent, voyagePlan: RtzVoyagePlan): Promise<string> {
    if (event.callbackEndpoint) {
        console.info("Using callback endpoint from event!");
        return event.callbackEndpoint;
    }

    try {
        const url = await visService.queryCallBackForImo(voyagePlan.route.routeInfo[0].$.vesselIMO);

        return `${url}/area`;
    } catch (e) {
        return "";
    }
}

export const handler = handlerFn(new SQS(), withDbSecret);
