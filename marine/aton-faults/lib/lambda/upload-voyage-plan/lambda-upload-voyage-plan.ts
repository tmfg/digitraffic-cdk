import * as util from 'util';
import * as xml2js from 'xml2js';
import {RtzVoyagePlan} from "../../model/voyageplan";

interface UploadVoyagePlanEvent {
    /**
     * Endpoint URL for callback
     */
    readonly callbackEndpoint?: string

    /**
     * The route in RTZ format
     */
    readonly voyagePlan: string
}

export async function handler(event: UploadVoyagePlanEvent): Promise<void> {
    const parseXml = util.promisify(xml2js.parseString);
    const voyagePlan = (await parseXml(event.voyagePlan)) as RtzVoyagePlan;

}
