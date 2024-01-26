import type { Bucket } from "aws-cdk-lib/aws-s3";
import { MarinecamEnvKeys } from "./keys.js";
import type { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { MonitoredDBFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import type { MobileServerProps } from "./app-props.js";
import { Scheduler } from "@digitraffic/common/dist/aws/infra/scheduler";
import type { Function as AWSFunction } from "aws-cdk-lib/aws-lambda";

export function create(stack: DigitrafficStack, bucket: Bucket): void {
    const updateLambda = createUpdateImagesLambda(stack, bucket);

    Scheduler.every(
        stack,
        "UpdateImages-Rule",
        (stack.configuration as MobileServerProps).updateFrequency,
        updateLambda
    );
    bucket.grantWrite(updateLambda);
}

function createUpdateImagesLambda(stack: DigitrafficStack, bucket: Bucket): AWSFunction {
    const environment = stack.createLambdaEnvironment();
    environment[MarinecamEnvKeys.BUCKET_NAME] = bucket.bucketName;

    return MonitoredDBFunction.create(stack, "update-images", environment);
}
