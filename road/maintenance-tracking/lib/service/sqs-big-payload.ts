import { SqsProducer, SqsConsumer } from 'sns-sqs-big-payload';
import * as MaintenanceTrackingDb from "../db/maintenance-tracking-db";
import * as MaintenanceTrackingService from "./maintenance-tracking";
import {Havainto} from "../lambda/process-queue/lambda-process-queue";
import moment from 'moment-timezone';

export function createSqsProducer(sqsQueueUrl : string, region : string, sqsBucketName : string) : SqsProducer {
    return SqsProducer.create({
        queueUrl: sqsQueueUrl,
        region: region,
        // to enable sending large payloads (>256KiB) though S3
        largePayloadThoughS3: true,
        // Opt-in to enable compatibility with
        // Amazon SQS Extended Client Java Library (and other compatible libraries).
        // see https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-s3-messages.html
        extendedLibraryCompatibility: false,
        s3Bucket: sqsBucketName
    });
}

export function createSqsConsumer(sqsQueueUrl : string, region : string, logFunctionName : string) : SqsConsumer {

    return SqsConsumer.create({
        queueUrl: sqsQueueUrl,
        region: region,
        getPayloadFromS3: true,
        // if you expect json payload - use `parsePayload` hook to parse it
        parsePayload: (raw) => {
            return JSON.parse(raw)
        },
        // message handler, payload already parsed at this point
        handleMessage: async ({payload, message, s3PayloadMeta}) => {
            /*
            s3PayloadMeta:
            {
                "Id": "abcdefg-hijklmn",
                "Bucket": "<bucket>",
                "Key": "abcdefg-hijklmn.json",
                "Location": "https://<bucket>.s3.eu-west-1.amazonaws.com/abcdefg-hijklmn.json"
            }
            */
            let s3Uri: string = '–';
            if (s3PayloadMeta) {
                console.info(`method=${logFunctionName} big-payload s3PayloadMeta: ${JSON.stringify(s3PayloadMeta)}`);
                s3Uri = s3PayloadMeta.Location;
            }

            const trackingJson = JSON.parse(payload);
            const trackingJsonString = payload;
            const messageSizeBytes = Buffer.byteLength(trackingJsonString);
            const sendingTime = moment(trackingJson.otsikko.lahetysaika).toDate();
            if (!trackingJson.otsikko.lahettaja.jarjestelma) {
                console.warn(`method=processMaintenanceTrackingQueue observations sendingSystem is empty using UNKNOWN s3Uri=%s`, s3Uri);
            }
            const sendingSystem = trackingJson.otsikko.lahettaja.jarjestelma ?? 'UNKNOWN';
            const observationDatas: MaintenanceTrackingDb.DbObservationData[] =
                trackingJson.havainnot.map((havainto: Havainto) => {
                    return MaintenanceTrackingService.convertToDbObservationData(havainto, sendingTime, sendingSystem, s3Uri);
                });
            // console.info(`method=processMaintenanceTrackingQueue saving %d observations message sizeBytes=%d`, observationDatas.length, messageSizeBytes);
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
        },
    });
}