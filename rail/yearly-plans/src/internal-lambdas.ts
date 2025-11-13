import {
  MonitoredFunction,
} from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import type { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import type { Bucket } from "aws-cdk-lib/aws-s3";
import { Scheduler } from "@digitraffic/common/dist/aws/infra/scheduler";
import { YearlyPlansEnvKeys } from "./keys.js";
import { EnvKeys } from "@digitraffic/common/dist/aws/runtime/environment";

export function create(
  stack: DigitrafficStack,
  bucket: Bucket,
): void {
  createFetchYearlyPlansLambda(stack, bucket);
}

function createFetchYearlyPlansLambda(
  stack: DigitrafficStack,
  bucket: Bucket,
): MonitoredFunction {
  const secret = stack.configuration.secretId

  if (!secret) {
    throw Error("Secret ID required")
  }

  const lambdaEnv = {
    [YearlyPlansEnvKeys.S3_BUCKET_NAME]: bucket.bucketName,
    [EnvKeys.SECRET_ID]: stack.configuration.secretId
  };

  const fetchYearlyPlansLambda = MonitoredFunction.createV2(
    stack,
    "update-plans",
    lambdaEnv,
    {
      reservedConcurrentExecutions: 1,
      timeout: 300,
      memorySize: 512,
      runtime: Runtime.NODEJS_22_X,
    },
  );

  stack.grantSecret(fetchYearlyPlansLambda);

  Scheduler.everyDay(stack, "schedule-daily", fetchYearlyPlansLambda);

  const s3Statement = new PolicyStatement();
  s3Statement.addActions("s3:PutObject");
  s3Statement.addActions("s3:PutObjectAcl");
  s3Statement.addResources(bucket.bucketArn + "/*");
  fetchYearlyPlansLambda.addToRolePolicy(s3Statement);

  return fetchYearlyPlansLambda;
}
