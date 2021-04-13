import * as util from 'util';
import * as xml2js from 'xml2js';
import {RtzVoyagePlan} from "../../../../../common/vis/voyageplan";
import {BAD_REQUEST_MESSAGE} from "../../../../../common/api/errors";
import {withSecret} from "../../../../../common/secrets/secret";


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

export const KEY_SECRET_ID = 'SECRET_ID';

const secretId = process.env[KEY_SECRET_ID] as string;

export function handlerFn(
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
            // do nothing currently
            return Promise.resolve();
        });
    };
}

export const handler = handlerFn(withSecret);
