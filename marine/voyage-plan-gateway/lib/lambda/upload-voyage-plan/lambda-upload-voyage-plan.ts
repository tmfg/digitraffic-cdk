import * as util from 'util';
import * as xml2js from 'xml2js';
import {withSecret} from "digitraffic-common/secrets/secret";
import {VoyagePlanEnvKeys} from "../../keys";
import * as VoyagePlansService from '../../service/voyageplans';
import {RtzVoyagePlan} from "digitraffic-common/rtz/voyageplan";
import {VisMessageWithCallbackEndpoint} from "../../model/vismessage";

const secretId = process.env[VoyagePlanEnvKeys.SECRET_ID] as string;

export function handlerFn(
    doWithSecret: (secretId: string, fn: (secret: any) => any) => any
): (event: any) => Promise<string> {
    return async function(event: any): Promise<string> {
        return await doWithSecret(secretId, async () => {

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
                return Promise.reject('XML parsing failed');
            }

            const structureValidationErrors = VoyagePlansService.validateStructure(voyagePlan);
            if (structureValidationErrors.length) {
                console.error('method=uploadVoyagePlan XML structure validation failed', structureValidationErrors);
                return Promise.reject('XML structure validation failed');
            }

            const contentValidationErrors = VoyagePlansService.validateContent(voyagePlan);
            if (contentValidationErrors.length) {
                console.error('method=uploadVoyagePlan XML content validation failed', contentValidationErrors);
                return Promise.reject('XML content was not valid');
            }

            // do nothing currently
            return Promise.resolve();
        });
    };
}

export const handler = handlerFn(withSecret);
