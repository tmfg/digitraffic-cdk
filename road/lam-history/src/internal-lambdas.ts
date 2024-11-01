import { Scheduler } from "@digitraffic/common/dist/aws/infra/scheduler";
import { MonitoredFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import type { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import type { Bucket } from "aws-cdk-lib/aws-s3";
import { LamHistoryEnvKeys } from "./keys.js";

export class InternalLambdas {
    constructor(stack: DigitrafficStack, bucket: Bucket) {
        const updateDataLambda = createDataUpdateLambda(stack, bucket.bucketName);

        // Allow lambda to read from secrets manager
        stack.grantSecret(updateDataLambda);

        // Allow lambda to write the bucket
        bucket.grantWrite(updateDataLambda);

        // Run once a day
        Scheduler.everyDay(stack, "LamHistoryUpdateRule", updateDataLambda);
    }
}

function createDataUpdateLambda(stack: DigitrafficStack, bucketName: string): MonitoredFunction {
    const environment = stack.createLambdaEnvironment();
    environment[LamHistoryEnvKeys.BUCKET_NAME] = bucketName;

    return MonitoredFunction.createV2(stack, "update-lam-stations", environment, {
        singleLambda: true,
        memorySize: 128,
        reservedConcurrentExecutions: 10
    });
}
