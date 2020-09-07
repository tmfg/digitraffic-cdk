import {saveEstimate} from "../../service/estimates";
import {validateEstimate} from "../../model/estimate";
import {SQSEvent} from "aws-lambda";
import {SNS} from 'aws-sdk';
const middy = require('@middy/core')
const sqsPartialBatchFailureMiddleware = require('@middy/sqs-partial-batch-failure')

export function handlerFn(sns: SNS) {
    return async (event: SQSEvent) => {
        return Promise.allSettled(event.Records.map(r => {
            const estimate = JSON.parse(r.body);
            if (!validateEstimate(estimate)) {
                return Promise.reject();
            }
            return saveEstimate(estimate);
        })).then(async estimates => {
            const successful = estimates.filter(processedSuccessfully);
            if (successful.length) {
                // fulfilled promises have a 'value' property
                // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled
                const updates = successful
                    .map(s => (s as any).value);
                await sns.publish({
                    Message: JSON.stringify(updates),
                    TopicArn: process.env.ESTIMATE_SNS_TOPIC_ARN
                }).promise();
            }
            return estimates;
        });
    };
}

function processedSuccessfully(p: PromiseSettledResult<any>) {
    return p.status === 'fulfilled';
}

export const handler: (e: SQSEvent) => Promise<any> = middy(handlerFn(new SNS())).use(sqsPartialBatchFailureMiddleware());
