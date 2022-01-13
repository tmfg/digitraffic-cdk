import * as util from 'util';
import * as xml2js from 'xml2js';
import {withSecret} from "digitraffic-common/aws/runtime/secrets/secret";
import {VoyagePlanEnvKeys} from "../../keys";
import * as VoyagePlansService from '../../service/voyageplans';
import {RtzVoyagePlan} from "digitraffic-common/marine/rtz";
import {VisMessageWithCallbackEndpoint} from "../../model/vismessage";
import {VtsApi} from "../../api/vts";
import {SlackApi} from "digitraffic-common/utils/slack";
import {RtzStorageApi} from "../../api/rtzstorage";
import {SecretFunction} from "digitraffic-common/aws/runtime/secrets/dbsecret";
const zlib = require('zlib');

const secretId = process.env[VoyagePlanEnvKeys.SECRET_ID] as string;
const bucketName = process.env[VoyagePlanEnvKeys.BUCKET_NAME] as string;

export type SnsEvent = {
    readonly Records: {
        readonly body: string
    }[]
}

type VoyagePlanSecrets = {
    readonly 'vpgw.vtsUrl'?: string
    readonly 'vpgw.slackUrl'?: string
}

let api: VtsApi | null = null;
let slackApi: SlackApi | null = null;
let rtzStorageApi: RtzStorageApi | null = null;

/**
 * XML parsing and validation errors do not throw an error. This is to remove invalid messages from the queue.
 */
export function handlerFn(doWithSecret: SecretFunction<VoyagePlanSecrets, string>,
    VtsApiClass: new (url: string) => VtsApi,
    SlackApiClass: new (url: string) => SlackApi) {
    return function(event: SnsEvent) {
        return doWithSecret(secretId, async (secret: VoyagePlanSecrets) => {
            if (event.Records.length > 1) {
                console.error('method=vpgwUploadVoyagePlan More than one record received! count=%d',
                    event.Records.length);
            }

            // base64 decode message
            const base64EventBody = Buffer.from(event.Records[0].body, 'base64');
            const gunzippedEventBody = zlib.gunzipSync(base64EventBody);
            const visMessage = JSON.parse(gunzippedEventBody.toString('utf-8')) as VisMessageWithCallbackEndpoint;

            console.info(`method=vpgwUploadVoyagePlan received RTZ ${visMessage.message}`);

            let voyagePlan: RtzVoyagePlan;
            try {
                const parseXml = util.promisify(xml2js.parseString);
                voyagePlan = await parseXml(visMessage.message) as RtzVoyagePlan;
            } catch (error) {
                console.warn('method=uploadVoyagePlan XML parsing failed', error);
                return Promise.resolve('XML parsing failed');
            }

            if (!rtzStorageApi) {
                rtzStorageApi = new RtzStorageApi(bucketName);
            }
            await rtzStorageApi.storeVoyagePlan(visMessage.message);

            if (!slackApi && secret["vpgw.slackUrl"]) {
                slackApi = new SlackApiClass(secret["vpgw.slackUrl"]);
            }

            const structureValidationErrors = VoyagePlansService.validateStructure(voyagePlan);
            if (structureValidationErrors.length) {
                console.warn('method=uploadVoyagePlan XML structure validation failed', structureValidationErrors);
                await slackApi?.notify('Failed validation, invalid structure :' + visMessage.message);
                return Promise.resolve('XML structure validation failed');
            }

            const contentValidationErrors = VoyagePlansService.validateContent(voyagePlan);
            if (contentValidationErrors.length) {
                console.warn('method=uploadVoyagePlan XML content validation failed', contentValidationErrors);
                await slackApi?.notify('Failed validation, invalid content :' + visMessage.message);
                return Promise.resolve('XML content was not valid');
            }

            if (!api && secret["vpgw.vtsUrl"]) {
                api = new VtsApiClass(secret["vpgw.vtsUrl"]);
            }

            if (api) {
                console.info('method=uploadVoyagePlan about to upload voyage plan to VTS');
                await slackApi?.notify('Passed validation :' + visMessage.message);
                await api.sendVoyagePlan(visMessage.message);
                console.info('method=uploadVoyagePlan upload to VTS ok');
            } else {
                console.info('method=uploadVoyagePlan No VTS API, voyage plan not sent');
            }

            return Promise.resolve('Voyage plan processed');
        });
    };
}

export const handler = handlerFn(withSecret, VtsApi, SlackApi);
