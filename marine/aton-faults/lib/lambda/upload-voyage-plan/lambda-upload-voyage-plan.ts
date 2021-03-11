import * as util from 'util';
import * as xml2js from 'xml2js';
import {RtzVoyagePlan} from "../../model/voyageplan";
import {findFaultIdsForVoyagePlan} from "../../service/voyageplan-faults";
import {SNS} from "aws-sdk";
import {ackReceivedVoyagePlan} from "../../api/vis-api";

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

    /**
     * Endpoint URL for ACK of received voyage plan
     */
    readonly deliveryAckEndPoint?: string
}

export const KEY_SEND_FAULT_SNS_TOPIC_ARN = 'SEND_FAULT_SNS_TOPIC_ARN';

const sendFaultSnsTopicArn = process.env[KEY_SEND_FAULT_SNS_TOPIC_ARN] as string;

export function handlerFn(
    sns: SNS,
    ackFn: (url: string) => Promise<void>
): (event: UploadVoyagePlanEvent) => Promise<void> {
    return async function(event: UploadVoyagePlanEvent): Promise<void> {
        const parseXml = util.promisify(xml2js.parseString);
        const voyagePlan = (await parseXml(event.voyagePlan)) as RtzVoyagePlan;

        if (event.deliveryAckEndPoint) {
            await ackFn(event.deliveryAckEndPoint);
        }

        // no need to send faults
        if (!event.callbackEndpoint) {
            return;
        }

        const faultIds = await findFaultIdsForVoyagePlan(voyagePlan);
        for (const faultId of faultIds) {
            await sns.publish({
                Message: JSON.stringify({
                    faultId,
                    callbackEndpoint: event.callbackEndpoint
                }),
                TopicArn: sendFaultSnsTopicArn
            }).promise();
        }
    };
}

export const handler = handlerFn(new SNS(), ackReceivedVoyagePlan);
