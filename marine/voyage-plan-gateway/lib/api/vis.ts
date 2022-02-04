import axios from "axios";
import {generateHmacAuthorizationHeader} from "../service/authentication";

export enum VisMessageType {
    RTZ = 'RTZ',
    TXT = 'TXT',
    S124 = 'S124'
}

export type VisMessage = {
    CallbackEndpoint: string
    id: string
    receivedAt: string
    FromOrgId: string
    FromOrgName: string
    FromServiceId: string
    messageType: string
    stmMessage: {
        message: string
    }
}

export type VisMessagesResponse = {
    readonly numberOfMessages: number
    readonly remainingNumberOfMessages: number
    readonly message: VisMessage[]
}

export async function getMessages(privateVisUrl: string, appId: string, apiKey: string): Promise<VisMessagesResponse> {
    const fullUrl = `${privateVisUrl}/getMessage`;
    const resp = await axios.get(fullUrl, {
        headers: {
            Accept: 'application/json',
            Authorization: generateHmacAuthorizationHeader(fullUrl, appId, apiKey),
        },
    });
    return resp.data as VisMessagesResponse;
}
