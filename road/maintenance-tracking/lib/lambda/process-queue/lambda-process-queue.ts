import * as MaintenanceTrackingService from "../../service/maintenance-tracking";
import {convertToDbObservationData} from "../../service/maintenance-tracking";
import * as SqsExt from "../../sqs-ext";
import {SQSEvent} from "aws-lambda";
import {SQSRecord} from "aws-lambda/trigger/sqs";
import moment from 'moment-timezone';
import {RECEIPT_HANDLE_SEPARATOR, SQS_BUCKET_NAME, SQS_QUEUE_URL} from "../constants";
import {DbObservationData} from "../../db/maintenance-tracking";
import * as R from 'ramda';

const middy = require('@middy/core')
const sqsPartialBatchFailureMiddleware = require('@middy/sqs-partial-batch-failure')

const sqsBucketName = process.env[SQS_BUCKET_NAME] as string;

export function handlerFn(sqsClient : any) { // typeof SQSExt
    return async (event: SQSEvent) => {
        // console.info(`method=processMaintenanceTrackingQueue Environment sqsBucketName: ${sqsBucketName}, sqsQueueUrl: ${sqsQueueUrl} events: ${event.Records.length}`)

        let records : [];
        try {
            // console.info("Records: %s", JSON.stringify(event.Records));
            records = await sqsClient.transformLambdaRecords(event.Records);
            if (records.length > 1) {
                console.warn(`method=processMaintenanceTrackingQueue transformLambdaRecords count %s > 1`, records.length);
            }
        } catch (e) {
            console.error(`method=processMaintenanceTrackingQueue transformLambdaRecords failed`, e);
            return Promise.reject(e);
        }

        return Promise.allSettled(records.map(async (record: SQSRecord) => {
            try {
                // console.info("SQSRecord: %s", JSON.stringify(record));
                const jsonString = record.body;
                const messageSizeBytes = Buffer.byteLength(jsonString);
                // Parse JSON to get sending time
                const s3Uri = record.receiptHandle.split(RECEIPT_HANDLE_SEPARATOR)[0];
                const s3Key = s3Uri.substring(s3Uri.lastIndexOf("/") + 1);

                const trackingJson = JSON.parse(jsonString);
                const sendingTime = moment(trackingJson.otsikko.lahetysaika).toDate();
                const sendingSystem = trackingJson.otsikko.lahettaja.jarjestelma
                const observationDatas: DbObservationData[] =
                    trackingJson.havainnot.map(( havainto: Havainto ) => {
                        return convertToDbObservationData(havainto, sendingTime, sendingSystem, s3Uri);
                    });

                console.info(`method=processMaintenanceTrackingQueue saving %d observations message sizeBytes=%d s3Key=%s`,
                             observationDatas.length, messageSizeBytes, s3Key);

                const start = Date.now();
                try {
                    const insertCount :number = await MaintenanceTrackingService.saveMaintenanceTrackingObservationData(observationDatas);
                    const end = Date.now();
                    console.info(`method=processMaintenanceTrackingQueue messageSendingTime=%s observations insertCount=%d of total count=%d observations tookMs=%d total message sizeBytes=%d s3Key=%s`,
                                 sendingTime.toISOString(), insertCount, observationDatas.length, (end - start), messageSizeBytes, s3Key);
                } catch (e) {
                    const clones = cloneObservationsWithoutJson(observationDatas);
                    console.error(`method=processMaintenanceTrackingQueue Error while handling tracking from SQS to db observationDatas: ${JSON.stringify(clones)}`, e);
                    return Promise.reject(e);
                }

                return Promise.resolve();
            } catch (e) {
                console.error(`method=processMaintenanceTrackingQueue Error while handling tracking from SQS`, e);
                return Promise.reject(e);
            }

        }));
    };
}

export const handler: (e: SQSEvent) => Promise<any> = middy(handlerFn(SqsExt.createSQSExtClient(sqsBucketName))).use(sqsPartialBatchFailureMiddleware());

export interface Havainto {
    readonly havainto: {
        readonly tyokone: {
            readonly id: number;
        },
        readonly urakkaid: number,
        readonly havaintoaika: string;
    }
}

export function cloneObservationsWithoutJson(datas: DbObservationData[]) : DbObservationData[] {
    return R.map(R.assoc('json', '{...REMOVED...}'), datas);
}
