import axios from "axios";
import { generateHmacAuthorizationHeader } from "../service/authentication.js";

export enum VisMessageType {
    RTZ = "RTZ",
    TXT = "TXT",
    S124 = "S124"
}

export interface VisMessage {
    readonly CallbackEndpoint: string;
    readonly id: string;
    readonly receivedAt: string;
    readonly FromOrgId: string;
    readonly FromOrgName: string;
    readonly FromServiceId: string;
    readonly messageType: string;
    readonly stmMessage: {
        message: string;
    };
}

export interface VisMessagesResponse {
    readonly numberOfMessages: number;
    readonly remainingNumberOfMessages: number;
    readonly message: VisMessage[];
}

export async function getMessages(
    privateVisUrl: string,
    appId: string,
    apiKey: string
): Promise<VisMessagesResponse> {
    const fullUrl = `${privateVisUrl}/getMessage`;
    const resp = await axios.get(fullUrl, {
        headers: {
            Accept: "application/json",
            Authorization: generateHmacAuthorizationHeader(fullUrl, appId, apiKey)
        }
    });
    return resp.data as VisMessagesResponse;
}
