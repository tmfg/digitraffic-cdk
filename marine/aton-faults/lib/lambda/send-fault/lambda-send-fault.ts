import {SNSEvent} from "aws-lambda";
import {getFaultS124ById} from "../../service/faults";
import {sendFault} from "../../service/fault-sender";

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
export async function handler(event: SNSEvent) {
    const snsEvent = JSON.parse(event.Records[0].Sns.Message) as SendFaultEvent[];
    for (const event of snsEvent) {
        const faultS124 = await getFaultS124ById(event.faultId);
        await sendFault(faultS124, event.callbackEndpoint);
    }
}
