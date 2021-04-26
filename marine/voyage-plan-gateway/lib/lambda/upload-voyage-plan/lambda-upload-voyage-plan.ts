import * as util from 'util';
import * as xml2js from 'xml2js';
import {BAD_REQUEST_MESSAGE, OK_MESSAGE} from "../../../../../common/api/errors";
import {withSecret} from "../../../../../common/secrets/secret";
import {KEY_SECRET_ID} from "./env_keys";

/**
 * Implementation for the Sea Traffic Management (STM) Voyage Information Service (VIS) uploadVoyagePlan interface.
 * https://www.seatrafficmanagement.info/developers-forum/vis/
 */

export interface UploadVoyagePlanEvent {
    /**
     * Endpoint URL for delivery acknowledgement
     */
    readonly deliveryAckEndpoint?: string

    /**
     * The route in RTZ format
     */
    readonly voyagePlan: string
}

const secretId = process.env[KEY_SECRET_ID] as string;

export function handlerFn(
    doWithSecret: (secretId: string, fn: (secret: any) => any) => any
): (event: UploadVoyagePlanEvent) => Promise<string> {
    return async function(event: UploadVoyagePlanEvent): Promise<string> {
        return await doWithSecret(secretId, async () => {
            try {
                const parseXml = util.promisify(xml2js.parseString);
                // discard result for now, just make sure it parses ok
                await parseXml(event.voyagePlan);
            } catch (error) {
                console.error('UploadVoyagePlan XML parsing failed', error);
                return Promise.reject(BAD_REQUEST_MESSAGE);
            }
            // TODO ack
            // do nothing currently
            return JSON.stringify({message: OK_MESSAGE});
        });
    };
}

export const handler = handlerFn(withSecret);
