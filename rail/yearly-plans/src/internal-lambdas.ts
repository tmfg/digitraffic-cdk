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
  yearlyPlansBucket: Bucket,
  projectPlansBucket: Bucket
): void {
  createFetchYearlyPlansLambda(stack, yearlyPlansBucket, projectPlansBucket);
}

function createFetchYearlyPlansLambda(
  stack: DigitrafficStack,
  yearlyPlansBucket: Bucket,
  projectPlansBucket: Bucket
): MonitoredFunction {
  const secret = stack.configuration.secretId

  if (!secret) {
    throw Error("Secret ID required")
  }

  const lambdaEnv = {
    [YearlyPlansEnvKeys.YEARLY_PLANS_BUCKET_NAME]: yearlyPlansBucket.bucketName,
    [YearlyPlansEnvKeys.PROJECT_PLANS_BUCKET_NAME]: projectPlansBucket.bucketName,
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
  s3Statement.addResources(yearlyPlansBucket.bucketArn + "/*");
  s3Statement.addResources(projectPlansBucket.bucketArn + "/*");

  fetchYearlyPlansLambda.addToRolePolicy(s3Statement);

  return fetchYearlyPlansLambda;
}
