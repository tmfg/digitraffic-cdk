import {saveTimestamp} from "../../service/timestamps";
import {validateTimestamp} from "../../model/timestamp";
import {SQSEvent} from "aws-lambda";
import {SNS} from 'aws-sdk';
import {withDbSecret} from "../../../../../common/secrets/dbsecret";
const middy = require('@middy/core')
const sqsPartialBatchFailureMiddleware = require('@middy/sqs-partial-batch-failure')

export function handlerFn(
    withDbSecretFn: (secretId: string, fn: (_: any) => Promise<void>) => Promise<any>,
    sns: SNS) {

    return async (event: SQSEvent) => {
        return Promise.allSettled(event.Records.map(r => {
            return withDbSecretFn(process.env.SECRET_ID as string, (_: any): Promise<any> => {
                const timestamp = JSON.parse(r.body);
                if (!validateTimestamp(timestamp)) {
                    return Promise.reject();
                }
                return saveTimestamp(timestamp);
            });
        })).then(async timestamps => {
            const successful = timestamps.filter(processedSuccessfully);
            if (successful.length) {
                // fulfilled promises have a 'value' property
                // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled
                const updates = successful
                    .map(s => (s as any).value)
                    .filter(s => s != null);
                if (updates.length) {
                    await sns.publish({
                        Message: JSON.stringify(updates),
                        TopicArn: process.env.ESTIMATE_SNS_TOPIC_ARN
                    }).promise();
                }
            }
            return timestamps;
        });
    };
}

function processedSuccessfully(p: PromiseSettledResult<any>) {
    return p.status === 'fulfilled';
}

export const handler: (e: SQSEvent) => Promise<any> = middy(handlerFn(withDbSecret, new SNS())).use(sqsPartialBatchFailureMiddleware());
