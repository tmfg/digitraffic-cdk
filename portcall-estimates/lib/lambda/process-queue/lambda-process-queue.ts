import {saveEstimate} from "../../service/estimates";
import {validateEstimate} from "../../model/estimate";
import {SQSEvent} from "aws-lambda";
const middy = require('@middy/core')
const sqsPartialBatchFailureMiddleware = require('@middy/sqs-partial-batch-failure')

export async function handlerFn(event: SQSEvent) {
    return Promise.allSettled(event.Records.map(r => {
        const estimate = JSON.parse(r.body);
        if (!validateEstimate(estimate)) {
            return Promise.reject();
        }
        return saveEstimate(estimate);
    }));
}

export const handler: (e: SQSEvent) => Promise<any> = middy(handlerFn).use(sqsPartialBatchFailureMiddleware());
