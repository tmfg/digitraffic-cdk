import axios from 'axios';

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
