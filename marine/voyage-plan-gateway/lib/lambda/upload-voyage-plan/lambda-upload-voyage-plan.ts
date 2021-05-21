import * as util from 'util';
import * as xml2js from 'xml2js';
import {BAD_REQUEST_MESSAGE, OK_MESSAGE} from "../../../../../common/api/errors";
import {withSecret} from "../../../../../common/secrets/secret";
import {VoyagePlanEnvKeys} from "../../keys";
import * as VoyagePlansService from '../../service/voyageplans';
import {RtzVoyagePlan} from "../../../../../common/rtz/voyageplan";

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

const secretId = process.env[VoyagePlanEnvKeys.SECRET_ID] as string;

export function handlerFn(
    doWithSecret: (secretId: string, fn: (secret: any) => any) => any
): (event: UploadVoyagePlanEvent) => Promise<string> {
    return async function(event: UploadVoyagePlanEvent): Promise<string> {
        return await doWithSecret(secretId, async () => {
            let voyagePlan: RtzVoyagePlan;
            try {
                const parseXml = util.promisify(xml2js.parseString);
                voyagePlan = await parseXml(event.voyagePlan) as RtzVoyagePlan;
            } catch (error) {
                console.error('method=uploadVoyagePlan XML parsing failed', error);
                return Promise.reject(BAD_REQUEST_MESSAGE);
            }

            const structureValidationErrors = VoyagePlansService.validateStructure(voyagePlan);
            if (structureValidationErrors.length) {
                console.error('method=uploadVoyagePlan XML structure validation failed', structureValidationErrors);
                return Promise.reject(BAD_REQUEST_MESSAGE);
            }

            const contentValidationErrors = VoyagePlansService.validateContent(voyagePlan);
            if (contentValidationErrors.length) {
                console.error('method=uploadVoyagePlan XML content validation failed', contentValidationErrors);
                return Promise.reject(BAD_REQUEST_MESSAGE);
            }

            // TODO ack
            // do nothing currently
            return JSON.stringify({message: OK_MESSAGE});
        });
    };
}

export const handler = handlerFn(withSecret);
