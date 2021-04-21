import * as MaintenanceTrackingService from "../../service/maintenance-tracking";
import * as SqsExt from "../../sqs-ext";
import {SQSEvent} from "aws-lambda";
import {SQSRecord} from "aws-lambda/trigger/sqs";
import moment from 'moment-timezone';
import {RECEIPT_HANDLE_SEPARATOR, SQS_BUCKET_NAME, SQS_QUEUE_URL} from "../constants";
import {DbObservationData, Status} from "../../db/db-maintenance-tracking";
import {createObservationHash} from "../../service/maintenance-tracking";

const middy = require('@middy/core')
const sqsPartialBatchFailureMiddleware = require('@middy/sqs-partial-batch-failure')

const sqsBucketName = process.env[SQS_BUCKET_NAME] as string;
const sqsQueueUrl = process.env[SQS_QUEUE_URL] as string;

export function handlerFn(sqsClient : any) { // typeof SQSExt
    return async (event: SQSEvent) => {
        console.info(`method=processMaintenanceTrackingQueue Environment sqsBucketName: ${sqsBucketName}, sqsQueueUrl: ${sqsQueueUrl} events: ${event.Records.length}`)

        let records : [];
        try {
            console.info("Records: %s", JSON.stringify(event.Records));
            records = await sqsClient.transformLambdaRecords(event.Records);
        } catch (e) {
            console.error(`method=processMaintenanceTrackingQueue transformLambdaRecords failed`, e);
            return Promise.reject(e);
        }

        return Promise.allSettled(records.map(async (record: SQSRecord) => {
            try {
                console.info("SQSRecord: %s", JSON.stringify(record));
                const jsonString = record.body;
                // Parse JSON to get sending time
                const s3Uri = record.receiptHandle.split(RECEIPT_HANDLE_SEPARATOR)[0];
                const trackingJson = JSON.parse(jsonString);
                const sendingTime = moment(trackingJson.otsikko.lahetysaika).toDate();

                const observationDatas: DbObservationData[] =
                trackingJson.havainnot.map(( item: Havainto ) => {
                    const observationJson = JSON.stringify(item.havainto);
                    const observationTime = moment(item.havainto.havaintoaika).toDate()
                    const harjaContractId = item.havainto.urakkaid;
                    const harjaWorkmachineId = item.havainto.tyokone.id;
                    const data: DbObservationData = {
                        observationTime: observationTime,
                        sendingTime: sendingTime,
                        json: observationJson,
                        harjaWorkmachineId: harjaWorkmachineId,
                        harjaContractId: harjaContractId,
                        status: Status.UNHANDLED,
                        hash: createObservationHash(observationJson),
                        s3Uri: s3Uri
                    };
                    console.info("havainto: ", JSON.stringify(data));
                    return data;
                    // console.info("havaintoaika: %s urakkaid: %s tyokone.id: %s", havaintoAika, urakkaId, tyokoneId);

                });

                await MaintenanceTrackingService.saveMaintenanceTrackingObservationData(observationDatas);

                console.info(`method=processMaintenanceTrackingQueue messageSendingTime: ${sendingTime.toUTCString()} observations insertCount=%d`, observationDatas.length);

                return Promise.resolve();
            } catch (e) {
                console.error(`method=processMaintenanceTrackingQueue Error while handling tracking from SQS to db data`, e);
                return Promise.reject(e);
            }

        }));
    };
}

export const handler: (e: SQSEvent) => Promise<any> = middy(handlerFn(SqsExt.createSQSExtClient(sqsBucketName))).use(sqsPartialBatchFailureMiddleware());

export interface Havainto {
    havainto: {
        tyokone: {
            id: number;
        },
        urakkaid: number,
        havaintoaika: string;
    }
}