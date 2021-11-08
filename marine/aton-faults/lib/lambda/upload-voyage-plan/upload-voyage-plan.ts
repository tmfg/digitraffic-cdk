import * as util from 'util';
import * as xml2js from 'xml2js';
import {RtzVoyagePlan} from "digitraffic-common/rtz/voyageplan";
import {SNS} from "aws-sdk";
import {SecretFunction, withDbSecret} from "digitraffic-common/secrets/dbsecret";
import {BAD_REQUEST_MESSAGE} from "digitraffic-common/api/errors";
import {AtonEnvKeys} from "../../keys";
import {VoyagePlanService} from "../../service/voyage-plan";
import {UploadVoyagePlanEvent} from "../../model/upload-voyageplan-event";
import {SECRET_ID} from "digitraffic-common/model/lambda-environment";
import {AtonSecret} from "../../model/secret";

/**
 * Implementation for the Sea Traffic Management (STM) Voyage Information Service (VIS) uploadVoyagePlan interface.
 * https://www.seatrafficmanagement.info/developers-forum/vis/
 */

const secretId = process.env[SECRET_ID] as string;
const sendFaultSnsTopicArn = process.env[AtonEnvKeys.SEND_FAULT_SNS_TOPIC_ARN] as string;

export function handlerFn(sns: SNS, doWithSecret: SecretFunction): (event: UploadVoyagePlanEvent) => Promise<void> {
    return async function(event: UploadVoyagePlanEvent): Promise<void> {
        return doWithSecret(secretId, async (secret: AtonSecret) => {
            let voyagePlan: RtzVoyagePlan;
            try {
                console.info("DEBUG voyageplan " + event.voyagePlan);

                const parseXml = util.promisify(xml2js.parseString);
                voyagePlan = (await parseXml(event.voyagePlan)) as RtzVoyagePlan;
            } catch (error) {
                console.error('UploadVoyagePlan XML parsing failed', error);
                return Promise.reject(BAD_REQUEST_MESSAGE);
            }

            //send faults to given callback endpoint, if present
            if (!event.callbackEndpoint) {
                console.info("no callback given!");
            } else {
                const vpService = new VoyagePlanService(sns, event.callbackEndpoint, sendFaultSnsTopicArn, secret);
                return vpService.handleVoyagePlan(voyagePlan);
            }
        }, {
            prefix: 'aton'
        });
    };
}

export const handler = handlerFn(new SNS(), withDbSecret);
