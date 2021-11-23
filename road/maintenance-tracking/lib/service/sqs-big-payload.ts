import { SqsProducer, SqsConsumer } from 'sns-sqs-big-payload';
import * as MaintenanceTrackingDb from "../db/maintenance-tracking-db";
import * as MaintenanceTrackingService from "./maintenance-tracking";
import {TyokoneenseurannanKirjaus, Havainto} from "../model/models"
import moment from 'moment-timezone';

// https://github.com/aspecto-io/sns-sqs-big-payload#sqs-producer
export function createSqsProducer(sqsQueueUrl : string, region : string, sqsBucketName : string) : SqsProducer {
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

// See https://github.com/aspecto-io/sns-sqs-big-payload/blob/master/docs/usage-in-lambda.md
export function createSqsConsumer(sqsQueueUrl : string, region : string, logFunctionName : string) : SqsConsumer {

    return SqsConsumer.create({
        queueUrl: sqsQueueUrl,
        region: region,
        getPayloadFromS3: true,
        // Parse JSON string payload to JSON object
        parsePayload: (raw) => {
            return JSON.parse(raw)
        },
        // Callback to handle message. Payload is parsed JSON object
        handleMessage: async ({payload, message, s3PayloadMeta}) => {
            return handleMessage(payload, message, s3PayloadMeta, logFunctionName);
        }
    });
}

export async function handleMessage(payload: TyokoneenseurannanKirjaus, message: any, s3PayloadMeta: S3PayloadMeta, logFunctionName: string) : Promise<void> {
    /*
    s3PayloadMeta:
    {
        "Id": "abcdefg-hijklmn",
        "Bucket": "<bucket>",
        "Key": "abcdefg-hijklmn.json",
        "Location": "https://<bucket>.s3.eu-west-1.amazonaws.com/abcdefg-hijklmn.json"
    }
    */
    let s3Uri = '–';
    if (s3PayloadMeta) {
        console.info(`method=${logFunctionName} big-payload s3PayloadMeta: ${JSON.stringify(s3PayloadMeta)}`);
        s3Uri = s3PayloadMeta.Location;
    }

    const trackingJson = payload;
    const trackingJsonString = JSON.stringify(payload);
    const messageSizeBytes = Buffer.byteLength(trackingJsonString);
    const sendingTime = moment(trackingJson.otsikko.lahetysaika).toDate();

    if (!trackingJson.otsikko.lahettaja.jarjestelma) {
        console.warn(`method=processMaintenanceTrackingQueue observations sendingSystem is empty using UNKNOWN s3Uri=%s`, s3Uri);
    }

    const sendingSystem = trackingJson.otsikko.lahettaja.jarjestelma ?? 'UNKNOWN';
    const observationDatas: MaintenanceTrackingDb.DbObservationData[] =
        trackingJson.havainnot.map((havainto: Havainto) =>
            MaintenanceTrackingService.convertToDbObservationData(havainto, sendingTime, sendingSystem, s3Uri));

    try {
        const start = Date.now();
        const insertCount: number = await MaintenanceTrackingService.saveMaintenanceTrackingObservationData(observationDatas);
        const end = Date.now();
        console.info(`method=processMaintenanceTrackingQueue messageSendingTime=%s observations insertCount=%d of total count=%d observations tookMs=%d total message sizeBytes=%d`,
            sendingTime.toISOString(), insertCount, observationDatas.length, (end - start), messageSizeBytes);
    } catch (e) {
        const clones =  MaintenanceTrackingDb.cloneObservationsWithoutJson(observationDatas);
        console.error(`method=processMaintenanceTrackingQueue Error while handling tracking from SQS to db observationDatas: ${JSON.stringify(clones)}`, e);
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