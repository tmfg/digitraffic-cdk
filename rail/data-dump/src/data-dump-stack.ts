import * as path from "node:path";
import { fileURLToPath } from "node:url";
import type { StackProps } from "aws-cdk-lib";
import { Duration, Stack } from "aws-cdk-lib";
import { Rule, Schedule } from "aws-cdk-lib/aws-events";
import { LambdaFunction as LambdaFunctionTarget } from "aws-cdk-lib/aws-events-targets";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import type { ILayerVersion } from "aws-cdk-lib/aws-lambda";
import {
  Code,
  Function as LambdaFunction,
  LayerVersion,
  Runtime,
  Tracing,
} from "aws-cdk-lib/aws-lambda";
import type { Construct } from "constructs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, "..");

/**
 * Configuration properties for the DataDump stack.
 * Environment-specific values that differ between Test (beta) and Prod.
 */
export interface DataDumpProps extends StackProps {
  /** S3 bucket for composition dump output */
  readonly compositionDumpBucket: string;
  /** S3 bucket for train dump output */
  readonly trainDumpBucket: string;
  /** S3 bucket for train location dump output */
  readonly trainLocationDumpBucket: string;
  /** Prefix for Lambda function names. Use empty string for original names. */
  readonly shortName: string;
}

/**
 * Stack for rail data dump Lambdas — compositions, trains, and train locations.
 * Uses L2 constructs with Code.fromAsset and a custom Lambda layer for dependencies.
 */
export class DataDumpStack extends Stack {
  constructor(scope: Construct, id: string, props: DataDumpProps) {
    super(scope, id, props);

    const depsLayer = new LayerVersion(this, "DataDumpDepsLayer", {
      code: Code.fromAsset(
        path.join(PROJECT_ROOT, "layers", "data-dump-deps.zip"),
      ),
      compatibleRuntimes: [Runtime.PYTHON_3_12],
      description: "Shared dependencies for data dump Lambda functions",
    });

    const s3Actions = ["s3:PutObject", "s3:CreateMultipartUpload"];

    const compositionDumperLambda = this.createDumperLambda(
      "CompositionDumperLambda",
      {
        functionName: props.shortName
          ? `${props.shortName}-DumpCompositions`
          : "DumpCompositions",
        handler: "dump-compositions.lambda_handler",
        memorySize: 128,
        dumpBucketName: props.compositionDumpBucket,
        codePath: path.join(PROJECT_ROOT, "src", "lambda", "dump-compositions"),
        layer: depsLayer,
      },
    );

    const trainDumperLambda = this.createDumperLambda("TrainDumperLambda", {
      functionName: props.shortName
        ? `${props.shortName}-DumpTrains`
        : "DumpTrains",
      handler: "dump-trains.lambda_handler",
      memorySize: 512,
      dumpBucketName: props.trainDumpBucket,
      codePath: path.join(PROJECT_ROOT, "src", "lambda", "dump-trains"),
      layer: depsLayer,
    });

    const trainLocationDumperLambda = this.createDumperLambda(
      "TrainLocationDumperLambda",
      {
        functionName: props.shortName
          ? `${props.shortName}-DumpTrainLocations`
          : "DumpTrainLocations",
        handler: "dump-train-locations.lambda_handler",
        memorySize: 2048,
        dumpBucketName: props.trainLocationDumpBucket,
        codePath: path.join(
          PROJECT_ROOT,
          "src",
          "lambda",
          "dump-train-locations",
        ),
        layer: depsLayer,
      },
    );

    const lambdaBucketPairs: [LambdaFunction, string][] = [
      [compositionDumperLambda, props.compositionDumpBucket],
      [trainDumperLambda, props.trainDumpBucket],
      [trainLocationDumperLambda, props.trainLocationDumpBucket],
    ];

    for (const [fn, bucket] of lambdaBucketPairs) {
      fn.addToRolePolicy(
        new PolicyStatement({
          actions: s3Actions,
          resources: [`arn:aws:s3:::${bucket}`, `arn:aws:s3:::${bucket}/*`],
        }),
      );
    }

    this.createCronRule(
      "CompositionCronEvent",
      "cron(17 15 5 * ? *)",
      compositionDumperLambda,
    );
    this.createCronRule(
      "TrainCronEvent",
      "cron(17 14 5 * ? *)",
      trainDumperLambda,
    );
    this.createCronRule(
      "TrainLocationCronEvent",
      "cron(17 12 * * ? *)",
      trainLocationDumperLambda,
    );
  }

  private createDumperLambda(
    id: string,
    config: {
      functionName: string;
      handler: string;
      memorySize: number;
      dumpBucketName: string;
      codePath: string;
      layer: ILayerVersion;
    },
  ): LambdaFunction {
    return new LambdaFunction(this, id, {
      functionName: config.functionName,
      handler: config.handler,
      memorySize: config.memorySize,
      code: Code.fromAsset(config.codePath),
      runtime: Runtime.PYTHON_3_12,
      timeout: Duration.seconds(900),
      tracing: Tracing.ACTIVE,
      reservedConcurrentExecutions: 1,
      layers: [config.layer],
      environment: {
        DUMP_BUCKET_NAME: config.dumpBucketName,
      },
    });
  }

  private createCronRule(
    id: string,
    scheduleExpression: string,
    targetLambda: LambdaFunction,
  ): Rule {
    const rule = new Rule(this, id, {
      schedule: Schedule.expression(scheduleExpression),
    });
    rule.addTarget(new LambdaFunctionTarget(targetLambda));
    return rule;
  }
}
