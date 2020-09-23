import {saveMaintenanceTrackingData} from "../../service/maintenance-tracking";

import {SQSEvent} from "aws-lambda";

const middy = require('@middy/core')
const sqsPartialBatchFailureMiddleware = require('@middy/sqs-partial-batch-failure')

export function handlerFn() {
    return async (event: SQSEvent) => {
        return Promise.allSettled(event.Records.map(r => {

            try {
                // Parse JSON to validate it's JSON
                JSON.parse(r.body);
            } catch (e) {
                console.error(`method=handleMaintenanceTrackingJson Error while parsing JSON: ${r.body}`, e);
                return Promise.reject();
            }
            const saved = saveMaintenanceTrackingData(r.body);
            console.info(`method=handleMaintenanceTrackingJson saved: ${JSON.stringify(saved)}`);
            return saved;

        })).then(async estimates => {

            const successful = estimates.filter(processedSuccessfully);
            if (successful.length) {
                console.info(`method=handleMaintenanceTrackingJson successCount=${successful.length}`);
            }
            return estimates;

        });
    };
}

function processedSuccessfully(p: PromiseSettledResult<any>) {
    return p.status === 'fulfilled';
}

export const handler: (e: SQSEvent) => Promise<any> = middy(handlerFn()).use(sqsPartialBatchFailureMiddleware());
