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
                console.error(`method=handleMaintenanceTrackingJson Error while parsing JSON count=1`, e);
                return Promise.reject(e);
            }
            try {
                return await saveMaintenanceTrackingData(r.body);
            } catch (e) {
                console.error(`method=handleMaintenanceTrackingJson Error saving JSON to db count=1 `, e);
                return Promise.reject(e);
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
