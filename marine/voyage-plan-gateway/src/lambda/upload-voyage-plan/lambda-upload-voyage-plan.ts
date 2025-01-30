import * as util from "util";
import * as xml2js from "xml2js";
import { VoyagePlanEnvKeys } from "../../keys.js";
import * as VoyagePlansService from "../../service/voyageplans.js";
import type { RtzVoyagePlan } from "@digitraffic/common/dist/marine/rtz";
import type { VisMessageWithCallbackEndpoint } from "../../model/vismessage.js";
import { VtsApi } from "../../api/vts.js";
import { SlackApi } from "@digitraffic/common/dist/utils/slack";
import { RtzStorageApi } from "../../api/rtzstorage.js";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import type { GenericSecret } from "@digitraffic/common/dist/aws/runtime/secrets/secret";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { gunzipSync } from "zlib";
import type { SQSEvent } from "aws-lambda";

interface VoyagePlanSecret extends GenericSecret {
  readonly "vpgw.vtsUrl": string;
  readonly "vpgw.slackUrl": string;
}

const secretHolder = SecretHolder.create<VoyagePlanSecret>();
const bucketName = getEnvVariable(VoyagePlanEnvKeys.BUCKET_NAME);

let api: VtsApi | undefined;
let slackApi: SlackApi | undefined;
let rtzStorageApi: RtzStorageApi | undefined;

/**
 * XML parsing and validation errors do not throw an error. This is to remove invalid messages from the queue.
 */
export function handler(event: SQSEvent): Promise<string> {
  return secretHolder.get().then(async (secret: VoyagePlanSecret) => {
    if (event.Records.length > 1) {
      logger.error({
        method: "vpgwUploadVoyagePlan.handler",
        message: "More than one record received!",
        customCount: event.Records.length,
      });
    }

    // base64 decode message
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const base64EventBody = Buffer.from(event.Records[0]!.body, "base64");
    const gunzippedEventBody: Buffer = gunzipSync(base64EventBody);
    const visMessage = JSON.parse(
      gunzippedEventBody.toString("utf-8"),
    ) as VisMessageWithCallbackEndpoint;

    logger.info({
      method: "vpgwUploadVoyagePlan.handler",
      message: `received RTZ ${visMessage.message}`,
    });

    let voyagePlan: RtzVoyagePlan;
    try {
      const parseXml = util.promisify(xml2js.parseString);
      voyagePlan = (await parseXml(visMessage.message)) as RtzVoyagePlan;
    } catch (error) {
      logger.warn({
        method: "vpgwUploadVoyagePlan.handler",
        message: "XML parsing failed",
        error: error,
      });

      return Promise.resolve("XML parsing failed");
    }

    if (!rtzStorageApi) {
      rtzStorageApi = new RtzStorageApi(bucketName);
    }
    await rtzStorageApi.storeVoyagePlan(visMessage.message);

    if (!slackApi) {
      slackApi = new SlackApi(secret["vpgw.slackUrl"]);
    }

    const structureValidationErrors = VoyagePlansService.validateStructure(
      voyagePlan,
    );
    if (structureValidationErrors.length) {
      logger.warn({
        method: "vpgwUploadVoyagePlan.handler",
        message: "XML structure validation failed",
        error: structureValidationErrors,
      });

      await slackApi.notify(
        "Failed validation, invalid structure :" + visMessage.message,
      );

      return Promise.resolve("XML structure validation failed");
    }

    const contentValidationErrors = VoyagePlansService.validateContent(
      voyagePlan,
    );
    if (contentValidationErrors.length) {
      logger.warn({
        method: "vpgwUploadVoyagePlan.handler",
        message: "XML content validation failed",
        error: contentValidationErrors,
      });

      await slackApi.notify(
        "Failed validation, invalid content :" + visMessage.message,
      );

      return Promise.resolve("XML content was not valid");
    }

    if (!api && secret["vpgw.vtsUrl"].length > 0) {
      api = new VtsApi(secret["vpgw.vtsUrl"]);
    }

    if (api) {
      logger.info({
        method: "vpgwUploadVoyagePlan.handler",
        message: "about to upload voyage plan to VTS",
      });

      await slackApi.notify("Passed validation :" + visMessage.message);
      await api.sendVoyagePlan(visMessage.message);

      logger.info({
        method: "vpgwUploadVoyagePlan.handler",
        message: "upload to VTS OK",
      });
    } else {
      logger.info({
        method: "vpgwUploadVoyagePlan.handler",
        message: "No VTS API, voyage plan not sent",
      });
    }

    return Promise.resolve("Voyage plan processed");
  });
}
