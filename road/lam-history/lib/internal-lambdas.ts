import { Scheduler } from "@digitraffic/common/dist/aws/infra/scheduler";
import { MonitoredFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { createSubscription } from "@digitraffic/common/dist/aws/infra/stack/subscription";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { LamHistoryEnvKeys } from "./keys";

export class InternalLambdas {
    constructor(
        stack: DigitrafficStack,
        bucket: Bucket,
        logsDestinationArn: string | undefined
    ) {
        const updateDataLambda = createDataUpdateLambda(
            stack,
            bucket.bucketName
        );

        // Allow lambda to read from secrets manager
        stack.grantSecret(updateDataLambda);

        // Allow lambda to write the bucket
        bucket.grantWrite(updateDataLambda);

        // Run once a day
        Scheduler.everyDay(stack, "LamHistoryUpdateRule", updateDataLambda);

        // Create log subscription
        if (logsDestinationArn) {
            createSubscription(
                updateDataLambda,
                updateDataLambda.givenName,
                logsDestinationArn,
                stack
            );
        }
    }
}

function createDataUpdateLambda(
    stack: DigitrafficStack,
    bucketName: string
): MonitoredFunction {
    const environment = stack.createLambdaEnvironment();
    environment[LamHistoryEnvKeys.BUCKET_NAME] = bucketName;

    return MonitoredFunction.createV2(
        stack,
        "update-lam-stations",
        environment,
        {
            singleLambda: true,
        }
    );
}
