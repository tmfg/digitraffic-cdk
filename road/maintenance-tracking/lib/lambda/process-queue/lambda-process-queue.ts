import {saveMaintenanceTrackingData} from "../../service/maintenance-tracking";

import {SQSEvent} from "aws-lambda";

const middy = require('@middy/core')
const sqsPartialBatchFailureMiddleware = require('@middy/sqs-partial-batch-failure')

export function handlerFn() {
    return async (event: SQSEvent) => {
        return Promise.allSettled(event.Records.map(async r => {

            try {
                // Parse JSON to validate it's JSON
                JSON.parse(r.body);
            } catch (e) {
                console.error(`method=handleMaintenanceTrackingJson Error count=1 while parsing JSON: ${r.body}`, e);
                return Promise.reject();
            }
            try {
                const saved = await saveMaintenanceTrackingData(r.body);
                console.info(`method=handleMaintenanceTrackingJson saved count=1`);
                return saved;
            } catch (e) {
                console.error(`method=handleMaintenanceTrackingJson Error count=1 saving to db JSON: ${r.body}`, e);
                return Promise.reject();
            }
        })).then(async trackings => {

            const successful = trackings.filter(processedSuccessfully);
            if (successful.length) {
                console.info(`method=handleMaintenanceTrackingJson insertCount=${successful.length}`);
            }
            return trackings;

        });
    };
}

function processedSuccessfully(p: PromiseSettledResult<any>) {
    return p.status === 'fulfilled';
}

export const handler: (e: SQSEvent) => Promise<any> = middy(handlerFn()).use(sqsPartialBatchFailureMiddleware());
