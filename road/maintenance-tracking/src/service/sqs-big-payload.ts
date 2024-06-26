import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { type SQS } from "aws-sdk";
import { parseISO } from "date-fns";
import _ from "lodash";
import { SqsConsumer, SqsProducer } from "sns-sqs-big-payload";
import * as MaintenanceTrackingDb from "../dao/maintenance-tracking-dao.js";
import { MaintenanceTrackingEnvKeys } from "../keys.js";
import { type Havainto, type TyokoneenseurannanKirjaus } from "../model/models.js";
import * as MaintenanceTrackingService from "./maintenance-tracking.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

let sqsConsumerInstance: SqsConsumer | undefined;

/**
 * @param createNew should call create new instance of use old if it exists
 */
export function getSqsConsumerInstance(createNew: boolean = false): SqsConsumer {
    if (createNew || !sqsConsumerInstance) {
        sqsConsumerInstance = createSqsConsumer(
            getEnvVariable(MaintenanceTrackingEnvKeys.SQS_QUEUE_URL),
            getEnvVariable("AWS_REGION")
        );
    }
    return sqsConsumerInstance;
}

// https://github.com/aspecto-io/sns-sqs-big-payload#sqs-producer
export function createSqsProducer(sqsQueueUrl: string, region: string, sqsBucketName: string): SqsProducer {
    return SqsProducer.create({
        queueUrl: sqsQueueUrl,
        region: region,
        // true = Enable big payload to be send wia S3. Limit is 256KB
        // See https://aws.amazon.com/sqs/features/
        largePayloadThoughS3: true,
        // If true, library uses compatibility mode with Amazon SQS Extended Client Library for Java
        // See https://github.com/awslabs/amazon-sqs-java-extended-client-lib
        extendedLibraryCompatibility: false,
        s3Bucket: sqsBucketName
    });
}

interface SqsBigMessage {
    payload: TyokoneenseurannanKirjaus;
    message: SQS.Message;
    s3PayloadMeta: S3PayloadMeta;
}

// See https://github.com/aspecto-io/sns-sqs-big-payload/blob/master/docs/usage-in-lambda.md
function createSqsConsumer(sqsQueueUrl: string, region: string): SqsConsumer {
    return SqsConsumer.create({
        queueUrl: sqsQueueUrl,
        region: region,
        getPayloadFromS3: true,
        // Parse JSON string payload to JSON object
        parsePayload: (raw: string) => {
            return JSON.parse(raw) as TyokoneenseurannanKirjaus;
        },
        // Callback to handle message. Payload is parsed JSON object
        handleMessage: (message: SqsBigMessage) => {
            return handleMessage(message.payload, message.message, message.s3PayloadMeta);
        }
    });
}

export async function handleMessage(
    payload: TyokoneenseurannanKirjaus,
    _message: SQS.Message,
    s3PayloadMeta: S3PayloadMeta | undefined
): Promise<void> {
    /*
    s3PayloadMeta:
    {
        "Id": "abcdefg-hijklmn",
        "Bucket": "<bucket>",
        "Key": "abcdefg-hijklmn.json",
        "Location": "https://<bucket>.s3.eu-west-1.amazonaws.com/abcdefg-hijklmn.json"
    }
    */
    let s3Uri = "–";
    if (s3PayloadMeta?.Location) {
        logger.debug({
            method: "SqsBigPayload.handleMessage",
            message: `big-payload s3PayloadMeta: ${JSON.stringify(s3PayloadMeta)}`
        });
        s3Uri = s3PayloadMeta.Location;
    }

    const trackingJson = payload;
    const trackingJsonString = JSON.stringify(payload);
    const messageSizeBytes = Buffer.byteLength(trackingJsonString);
    const sendingTime = parseISO(trackingJson.otsikko.lahetysaika);

    if (!trackingJson.otsikko.lahettaja.jarjestelma) {
        logger.warn({
            method: "SqsBigPayload.handleMessage",
            message: `observations sendingSystem is empty using UNKNOWN s3Uri=${s3Uri}`
        });
    }

    const sendingSystem = _.get(trackingJson, ["otsikko", "lahettaja", "jarjestelma"], "UNKNOWN");
    const observationDatas: MaintenanceTrackingDb.DbObservationData[] = trackingJson.havainnot.map(
        (havainto: Havainto) =>
            MaintenanceTrackingService.convertToDbObservationData(havainto, sendingTime, sendingSystem, s3Uri)
    );

    try {
        const start = Date.now();
        const insertCount: number = await MaintenanceTrackingService.saveMaintenanceTrackingObservationData(
            observationDatas
        );
        const end = Date.now();
        logger.info({
            method: "SqsBigPayload.handleMessage",
            message: `observations messageSendingTime=${sendingTime.toISOString()}`,
            tookMs: end - start,
            customDomain: "state-roads",
            customInsertCount: insertCount,
            customCount: observationDatas.length,
            customSizeBytes: messageSizeBytes
        });
    } catch (e) {
        const clones = MaintenanceTrackingDb.cloneObservationsWithoutJson(observationDatas);
        logger.error({
            method: "SqsBigPayload.handleMessage",
            message: `Error while handling tracking from SQS to db observationDatas: ${JSON.stringify(
                clones
            )}`,
            error: e
        });
        return Promise.reject(e);
    }
    return Promise.resolve();
}

export interface S3PayloadMeta {
    readonly Id: string;
    readonly Bucket: string;
    readonly Key: string;
    readonly Location: string;
}
