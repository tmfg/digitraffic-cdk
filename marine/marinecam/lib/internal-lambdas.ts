import {Bucket} from "@aws-cdk/aws-s3";
import {DigitrafficLogSubscriptions} from "digitraffic-common/stack/subscription";
import {MarinecamEnvKeys} from "./keys";
import {DigitrafficStack} from "digitraffic-common/stack/stack";
import {MonitoredFunction} from "digitraffic-common/lambda/monitoredfunction";
import {MobileServerProps} from "./app-props";
import {Scheduler} from "digitraffic-common/scheduler/scheduler";

export function create(
    stack: DigitrafficStack,
    bucket: Bucket) {

    const updateLambda = createUpdateImagesLambda(stack, bucket);

    stack.grantSecret(updateLambda);
    bucket.grantWrite(updateLambda);

    new DigitrafficLogSubscriptions(stack, updateLambda);
}

function createUpdateImagesLambda(stack: DigitrafficStack,
                                  bucket: Bucket) {
    const environment = stack.createLambdaEnvironment();
    environment[MarinecamEnvKeys.BUCKET_NAME] = bucket.bucketName;

    const lambda = MonitoredFunction.createV2(stack, 'update-images', environment, {
        reservedConcurrentExecutions: 2
    });

    Scheduler.every(stack, 'UpdateImages-Rule', (stack.configuration as MobileServerProps).updateFrequency, lambda);

    return lambda;
}
