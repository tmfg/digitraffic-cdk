import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { Scheduler } from "@digitraffic/common/dist/aws/infra/scheduler";
import { FunctionBuilder } from "@digitraffic/common/dist/aws/infra/stack/dt-function";
import { Duration } from "aws-cdk-lib";
import { Schedule } from "aws-cdk-lib/aws-events";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import type { Function as AwsFunction } from "aws-cdk-lib/aws-lambda";
import { Code, LayerVersion, Runtime } from "aws-cdk-lib/aws-lambda";
import type { DataDumpStack } from "./data-dump-stack.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, "..");

const S3_ACTIONS = ["s3:PutObject"];

/**
 * Creates internal Lambda functions and EventBridge schedules for the data-dump stack.
 */
export function create(stack: DataDumpStack): void {
  const props = stack.dataDumpProps;

  const depsLayer = new LayerVersion(stack, "DataDumpDepsLayer", {
    code: Code.fromAsset(
      path.join(PROJECT_ROOT, "layers", "data-dump-deps.zip"),
    ),
    compatibleRuntimes: [Runtime.PYTHON_3_12],
    description: "Shared dependencies for data dump Lambda functions",
  });

  const compositionLambda = createDumperLambda(stack, "dump-compositions", {
    memorySize: 128,
    bucket: props.compositionDumpBucket,
    layer: depsLayer,
  });

  const trainLambda = createDumperLambda(stack, "dump-trains", {
    memorySize: 512,
    bucket: props.trainDumpBucket,
    layer: depsLayer,
  });

  const trainLocationLambda = createDumperLambda(
    stack,
    "dump-train-locations",
    {
      memorySize: 2048,
      bucket: props.trainLocationDumpBucket,
      layer: depsLayer,
    },
  );

  new Scheduler(
    stack,
    "CompositionCronEvent",
    Schedule.cron({ minute: "17", hour: "15", day: "5" }),
    compositionLambda,
  );
  new Scheduler(
    stack,
    "TrainCronEvent",
    Schedule.cron({ minute: "17", hour: "14", day: "5" }),
    trainLambda,
  );
  new Scheduler(
    stack,
    "TrainLocationCronEvent",
    Schedule.cron({ minute: "17", hour: "12" }),
    trainLocationLambda,
  );
}

function createDumperLambda(
  stack: DataDumpStack,
  name: string,
  config: { memorySize: number; bucket: string; layer: LayerVersion },
): AwsFunction {
  const fn = FunctionBuilder.plain(stack, name)
    .withCode(Code.fromAsset(path.join(PROJECT_ROOT, "src", "lambda", name)))
    .withHandler(name, "lambda_handler")
    .withRuntime(Runtime.PYTHON_3_12)
    .withMemorySize(config.memorySize)
    .withTimeout(Duration.seconds(900))
    .withReservedConcurrentExecutions(1)
    .withEnvironment({ DUMP_BUCKET_NAME: config.bucket })
    .withLayers(config.layer)
    .withRolePolicies(
      new PolicyStatement({
        actions: S3_ACTIONS,
        resources: [
          `arn:aws:s3:::${config.bucket}`,
          `arn:aws:s3:::${config.bucket}/*`,
        ],
      }),
    )
    .build();
  return fn;
}
