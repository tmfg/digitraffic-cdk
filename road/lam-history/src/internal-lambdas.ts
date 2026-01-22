import { Scheduler } from "@digitraffic/common/dist/aws/infra/scheduler";
import { FunctionBuilder } from "@digitraffic/common/dist/aws/infra/stack/dt-function";
import type { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import type { Function as AwsFunction } from "aws-cdk-lib/aws-lambda";
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

function createDataUpdateLambda(
  stack: DigitrafficStack,
  bucketName: string,
): AwsFunction {
  const environment = stack.createLambdaEnvironment();
  environment[LamHistoryEnvKeys.BUCKET_NAME] = bucketName;

  return FunctionBuilder.create(stack, "update-lam-stations")
    .singleLambda()
    .withoutDatabaseAccess()
    .withEnvironment(environment)
    .build();
}
