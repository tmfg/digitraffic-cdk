import axios from 'axios';
import {Agent} from 'https';

export interface UploadVoyagePlanAck {
    /**
     * ACK id
     */
    readonly id: string

    /**
     * Reference for delivered message, STM MRN
     */
    readonly referenceId: string

    /**
     * Time of delivery
     */
    readonly timeOfDelivery: string

    /**
     * Identity of sender, STM MRN
     */
    readonly fromId: string

    /**
     * Friendly name of sender
     */
    readonly fromName: string

    /**
     * Identity of recipient, STM MRN
     */
    readonly toId: string

    /**
     * Friendly name of recipient
     */
    readonly toName: string

    /**
     * Descriptive acknowledgement message
     */
    readonly ackResult: string
}

export async function ackReceivedVoyagePlan(uri: string) {

}

export async function uploadArea(
    faultS124: string,
    uri: string,
    clientCertificate: string,
    privateKey: string): Promise<void> {

    const resp = await axios.post(uri, faultS124, {
        httpsAgent: new Agent({
            cert: clientCertificate,
            key: privateKey
        })
    });
    if (resp.status != 200) {
        console.error(`method=uploadArea returned status=${resp.status}`);
        return Promise.reject();
    }
}
