import * as MaintenanceTrackingService from "../../service/maintenance-tracking";
import {convertToDbObservationData} from "../../service/maintenance-tracking";
import {SQSEvent} from "aws-lambda";
import {SQSRecord} from "aws-lambda/trigger/sqs";
import moment from 'moment-timezone';
import {SQS_BUCKET_NAME, SQS_QUEUE_URL} from "../constants";
import {DbObservationData} from "../../db/maintenance-tracking";
import * as R from 'ramda';

const middy = require('@middy/core')
const sqsPartialBatchFailureMiddleware = require('@middy/sqs-partial-batch-failure')

const sqsBucketName = process.env[SQS_BUCKET_NAME] as string;
const sqsQueueUrl = process.env[SQS_QUEUE_URL] as string;
const region = process.env.AWS_REGION as string;

import * as SqsBigPayload from 'sns-sqs-big-payload';

const sqsConsumer = SqsBigPayload.SqsConsumer.create({
    queueUrl: sqsQueueUrl,
    region: region,
    getPayloadFromS3: true,
    // if you expect json payload - use `parsePayload` hook to parse it
    parsePayload: (raw) => {
        return JSON.parse(raw)
    },
    // message handler, payload already parsed at this point
    handleMessage: async ({ payload, message, s3PayloadMeta }) => {
        /*
        s3PayloadMeta:
        {
            "Id": "abcdefg-hijklmn",
            "Bucket": "<bucket>",
            "Key": "abcdefg-hijklmn.json",
            "Location": "https://<bucket>.s3.eu-west-1.amazonaws.com/abcdefg-hijklmn.json"
        }
        */
        let s3Uri : string = '–';
        if (s3PayloadMeta) {
            console.info(`method=processMaintenanceTrackingQueue.sqsConsumer.handleMessage big-payload s3PayloadMeta: ${JSON.stringify(s3PayloadMeta)}`);
            s3Uri = s3PayloadMeta.Location;
        } //else {
        //     console.info(`method=processMaintenanceTrackingQueue.sqsConsumer.handleMessage typeof payload: ${typeof payload} `);
        // }

        const trackingJson = JSON.parse(payload);
        const trackingJsonString = payload;
        const messageSizeBytes = Buffer.byteLength(trackingJsonString);
        const sendingTime = moment(trackingJson.otsikko.lahetysaika).toDate();
        if (!trackingJson.otsikko.lahettaja.jarjestelma) {
            console.warn(`method=processMaintenanceTrackingQueue observations sendingSystem is empty using UNKNOWN s3Uri=%s`, s3Uri);
        }
        const sendingSystem = trackingJson.otsikko.lahettaja.jarjestelma ?? 'UNKNOWN';
        const observationDatas: DbObservationData[] =
            trackingJson.havainnot.map(( havainto: Havainto ) => {
                return convertToDbObservationData(havainto, sendingTime, sendingSystem, s3Uri);
            });
        console.info(`method=processMaintenanceTrackingQueue saving %d observations message sizeBytes=%d`, observationDatas.length, messageSizeBytes);
        try {
            const start = Date.now();
            const insertCount :number = await MaintenanceTrackingService.saveMaintenanceTrackingObservationData(observationDatas);
            const end = Date.now();
            console.info(`method=processMaintenanceTrackingQueue messageSendingTime=%s observations insertCount=%d of total count=%d observations tookMs=%d total message sizeBytes=%d`,
                         sendingTime.toISOString(), insertCount, observationDatas.length, (end - start), messageSizeBytes);
        } catch (e) {
            const clones = cloneObservationsWithoutJson(observationDatas);
            console.error(`method=processMaintenanceTrackingQueue Error while handling tracking from SQS to db observationDatas: ${JSON.stringify(clones)}`, e);
            return Promise.reject(e);
        }
        return Promise.resolve();
    },
});

export async function handlerFn(event: SQSEvent) {
    console.info(`method=processMaintenanceTrackingQueue Environment sqsBucketName: ${sqsBucketName}, sqsQueueUrl: ${sqsQueueUrl} events: ${event.Records.length} and region: ${region}`)

    return Promise.allSettled(event.Records.map(async (record : SQSRecord) => {
        try {
            // clone event as library uses PascalCase properties -> include properties in Camel- And PascalCase
            const clone = cloneRecordWithCamelAndPascal(record);
            // console.debug(`DEBUG method=processMaintenanceTrackingQueue send to sqsConsumer.processMessage ${JSON.stringify(clone)}`);
            await sqsConsumer.processMessage(clone, { deleteAfterProcessing: false });
            // console.debug(`DEBUG method=processMaintenanceTrackingQueue sqsConsumer.processMessage done`);
            return Promise.resolve();
        } catch (e) {
            console.error(`method=processMaintenanceTrackingQueue Error while handling tracking from SQS`, e);
            return Promise.reject(e);
        }
    }));
}

export const handler: (e: any) => Promise<any> = middy(handlerFn).use(sqsPartialBatchFailureMiddleware());

export interface Havainto {
    readonly havainto: {
        readonly tyokone: {
            readonly id: number;
        },
        readonly urakkaid: number,
        readonly havaintoaika: string;
    }
}

export function cloneRecordWithCamelAndPascal(record: any) {
    const clone : any = {};
    for (const key in record) {
        if (record.hasOwnProperty(key)) {
            clone[key.charAt(0).toUpperCase() + key.substring(1)] = record[key];
            clone[key.charAt(0).toLowerCase() + key.substring(1)] = record[key];
        }
    }
    return clone;
}

export function cloneObservationsWithoutJson(datas: DbObservationData[]) : DbObservationData[] {
    return R.map(R.assoc('json', '{...REMOVED...}'), datas);
}
