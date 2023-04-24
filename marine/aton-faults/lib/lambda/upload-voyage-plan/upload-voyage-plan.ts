import * as util from "util";
import * as xml2js from "xml2js";
import { RtzVoyagePlan } from "@digitraffic/common/dist/marine/rtz";
import { SQS } from "aws-sdk";
import { BAD_REQUEST_MESSAGE } from "@digitraffic/common/dist/aws/types/errors";
import { AtonEnvKeys } from "../../keys";
import { VoyagePlanService } from "../../service/voyage-plan";
import { UploadVoyagePlanEvent } from "../../model/upload-voyageplan-event";
import { AtonSecret } from "../../model/secret";
import { decodeBase64ToAscii } from "@digitraffic/common/dist/utils/base64";
import { VisService } from "../../service/vis";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";

/**
 * Implementation for the Sea Traffic Management (STM) Voyage Information Service (VIS) uploadVoyagePlan interface.
 * https://www.seatrafficmanagement.info/developers-forum/vis/
 */

const secretHolder = SecretHolder.create<AtonSecret>("aton");
const sendS124QueueUrl = getEnvVariable(AtonEnvKeys.SEND_S124_QUEUE_URL);

let visService: VisService | undefined;

async function getVisService(): Promise<VisService> {
    return secretHolder.get().then((secret: AtonSecret) => {
        const clientCertificate = decodeSecretValue(secret.certificate);
        const privateKey = decodeSecretValue(secret.privatekey);
        const caCert = decodeSecretValue(secret.ca);
        return new VisService(caCert, clientCertificate, privateKey, secret.serviceRegistryUrl);
    });
}

export function handlerFn(sqs: SQS): (event: UploadVoyagePlanEvent) => Promise<void> {
    return async function (event: UploadVoyagePlanEvent): Promise<void> {
        if (!visService) {
            visService = await getVisService();
        }

        let voyagePlan: RtzVoyagePlan;
        try {
            logger.debug(event.voyagePlan);

            const parseXml = util.promisify(xml2js.parseString);
            voyagePlan = (await parseXml(event.voyagePlan)) as RtzVoyagePlan;
        } catch (error) {
            logger.error({
                method: "UpdateVoyagePlan.handler",
                message: "UploadVoyagePlan XML parsing failed",
                customDetails: JSON.stringify(error)
            });
            return Promise.reject(BAD_REQUEST_MESSAGE);
        }

        const endpoint = await getEndpointUrl(event, voyagePlan, visService);
        //send faults to given callback endpoint, if present
        if (!endpoint) {
            logger.info({
                method: "UpdateVoyagePlan.handler",
                message: "no endpoint url!"
            });
        } else {
            const vpService = new VoyagePlanService(sqs, endpoint, sendS124QueueUrl);
            return vpService.handleVoyagePlan(voyagePlan);
        }
        return Promise.resolve();
    };
}

function decodeSecretValue(value: string | undefined) {
    // for tests, no need to inject base64-stuff into secret
    if (!value) {
        return "";
    }

    return decodeBase64ToAscii(value);
}

async function getEndpointUrl(
    event: UploadVoyagePlanEvent,
    voyagePlan: RtzVoyagePlan,
    visService: VisService
): Promise<string> {
    if (event.callbackEndpoint) {
        logger.info({
            method: "UpdateVoyagePlan.getEndpointUrl",
            message: "Using callback endpoint from event!"
        });
        return event.callbackEndpoint;
    }

    try {
        const url = await visService.queryCallBackForImo(voyagePlan.route.routeInfo[0].$.vesselIMO);

        return url ? `${url}/area` : "";
    } catch (e) {
        return "";
    }
}

export const handler = handlerFn(new SQS());
