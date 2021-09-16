import * as util from 'util';
import * as xml2js from 'xml2js';
import {RtzVoyagePlan} from "digitraffic-common/rtz/voyageplan";
import * as FaultsService from "../../service/faults";
import {SNS} from "aws-sdk";
import {withDbSecret} from "digitraffic-common/secrets/dbsecret";
import {BAD_REQUEST_MESSAGE} from "digitraffic-common/api/errors";
import {AtonEnvKeys} from "../../keys";

/**
 * Implementation for the Sea Traffic Management (STM) Voyage Information Service (VIS) uploadVoyagePlan interface.
 * https://www.seatrafficmanagement.info/developers-forum/vis/
 */

export interface UploadVoyagePlanEvent {
    /**
     * Endpoint URL for callback
     */
    readonly callbackEndpoint?: string

    /**
     * The route in RTZ format
     */
    readonly voyagePlan: string
}

const secretId = process.env[AtonEnvKeys.SECRET_ID] as string;
const sendFaultSnsTopicArn = process.env[AtonEnvKeys.SEND_FAULT_SNS_TOPIC_ARN] as string;

export function handlerFn(
    sns: SNS,
    doWithSecret: (secretId: string, fn: (secret: any) => any) => any
): (event: UploadVoyagePlanEvent) => Promise<void> {
    return async function(event: UploadVoyagePlanEvent): Promise<void> {
        return await doWithSecret(secretId, async () => {
            let voyagePlan: RtzVoyagePlan;
            try {
                const parseXml = util.promisify(xml2js.parseString);
                voyagePlan = (await parseXml(event.voyagePlan)) as RtzVoyagePlan;
            } catch (error) {
                console.error('UploadVoyagePlan XML parsing failed', error);
                return Promise.reject(BAD_REQUEST_MESSAGE);
            }

            // no need to send faults
            if (!event.callbackEndpoint) {
                return;
            }

            const faultIds = await FaultsService.findFaultIdsForVoyagePlan(voyagePlan);
            for (const faultId of faultIds) {
                await sns.publish({
                    Message: JSON.stringify({
                        faultId,
                        callbackEndpoint: event.callbackEndpoint
                    }),
                    TopicArn: sendFaultSnsTopicArn
                }).promise();
            }
            return Promise.resolve('');
        });
    };
}

export const handler = handlerFn(new SNS(), withDbSecret);
