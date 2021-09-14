import * as util from 'util';
import * as xml2js from 'xml2js';
import {withSecret} from "digitraffic-common/secrets/secret";
import {VoyagePlanEnvKeys} from "../../keys";
import * as VoyagePlansService from '../../service/voyageplans';
import {RtzVoyagePlan} from "digitraffic-common/rtz/voyageplan";
import {VisMessageWithCallbackEndpoint} from "../../model/vismessage";
import {VtsApi} from "../../api/vts";

const secretId = process.env[VoyagePlanEnvKeys.SECRET_ID] as string;

export type SnsEvent = {
    readonly Records: {
       readonly body: string
    }[]
}

type VoyagePlanSecrets = {
    readonly 'vpgw.vtsUrl'?: string
}

let api: VtsApi | null = null

/**
 * XML parsing and validation errors do not throw an error. This is to remove invalid messages from the queue.
 */
export function handlerFn(
    doWithSecret: (secretId: string, fn: (secret: any) => any) => any,
    VtsApiClass: new (url: string) => VtsApi
): (event: SnsEvent) => Promise<string> {
    return async function(event: SnsEvent): Promise<string> {
        return await doWithSecret(secretId, async (secret: VoyagePlanSecrets) => {
            if (event.Records.length > 1) {
                console.error('method=vpgwUploadVoyagePlan More than one record received! count=%d',
                    event.Records.length);
            }

            const visMessage = JSON.parse(event.Records[0].body) as VisMessageWithCallbackEndpoint;
            let voyagePlan: RtzVoyagePlan;
            try {
                const parseXml = util.promisify(xml2js.parseString);
                voyagePlan = await parseXml(visMessage.message) as RtzVoyagePlan;
            } catch (error) {
                console.error('method=uploadVoyagePlan XML parsing failed', error);
                return Promise.resolve('XML parsing failed');
            }

            const structureValidationErrors = VoyagePlansService.validateStructure(voyagePlan);
            if (structureValidationErrors.length) {
                console.error('method=uploadVoyagePlan XML structure validation failed', structureValidationErrors);
                return Promise.resolve('XML structure validation failed');
            }

            const contentValidationErrors = VoyagePlansService.validateContent(voyagePlan);
            if (contentValidationErrors.length) {
                console.error('method=uploadVoyagePlan XML content validation failed', contentValidationErrors);
                return Promise.resolve('XML content was not valid');
            }

            if (!api && secret["vpgw.vtsUrl"]) {
                api = new VtsApiClass(secret["vpgw.vtsUrl"]);
            }

            if (api) {
                console.info('method=uploadVoyagePlan about to upload voyage plan to VTS');
                await api.sendVoyagePlan(visMessage.message);
                console.info('method=uploadVoyagePlan upload to VTS ok');
            } else {
                console.info('method=uploadVoyagePlan No VTS API, voyage plan not sent')
            }

            return Promise.resolve('Voyage plan processed');
        });
    };
}

export const handler = handlerFn(withSecret, VtsApi);
