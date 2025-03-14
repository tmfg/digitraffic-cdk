import {
  defaultLambdaConfiguration,
  type LambdaEnvironment,
} from "@digitraffic/common/dist/aws/infra/stack/lambda-configs";
import { MonitoredFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import type { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { DigitrafficLogSubscriptions } from "@digitraffic/common/dist/aws/infra/stack/subscription";
import { Duration, type Stack } from "aws-cdk-lib";
import {
  ComparisonOperator,
  TreatMissingData,
} from "aws-cdk-lib/aws-cloudwatch";
import { SnsAction } from "aws-cdk-lib/aws-cloudwatch-actions";
import { Rule, Schedule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { AssetCode, Runtime } from "aws-cdk-lib/aws-lambda";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";
import type { ISecret } from "aws-cdk-lib/aws-secretsmanager";
import type { Topic } from "aws-cdk-lib/aws-sns";
import { LambdaSubscription } from "aws-cdk-lib/aws-sns-subscriptions";
import { Queue, QueueEncryption } from "aws-cdk-lib/aws-sqs";
import type { VoyagePlanGatewayProps } from "./app-props.js";
import { VoyagePlanEnvKeys } from "./keys.js";

export function create(
  secret: ISecret,
  notifyTopic: Topic,
  props: VoyagePlanGatewayProps,
  stack: DigitrafficStack,
): void {
  const rtzBucket = new Bucket(stack, "RTZStorageBucket", {
    bucketName: props.rtzStorageBucketName,
    blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
  });

  const dlqBucket = new Bucket(stack, "DLQBucket", {
    bucketName: props.dlqBucketName,
    blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
  });

  const dlqQueueName = "VPGW-SendRouteDLQ.fifo";
  const dlq = new Queue(stack, dlqQueueName, {
    queueName: dlqQueueName,
    receiveMessageWaitTime: Duration.seconds(20),
    encryption: QueueEncryption.KMS_MANAGED,
    fifo: true,
  });

  const sendRouteQueueName = "VPGW-SendRouteQueue.fifo";
  const sendRouteQueue = new Queue(stack, sendRouteQueueName, {
    queueName: sendRouteQueueName,
    visibilityTimeout: Duration.seconds(60),
    encryption: QueueEncryption.KMS_MANAGED,
    fifo: true, // prevent sending route plans twice
    deadLetterQueue: {
      maxReceiveCount: 3,
      queue: dlq,
    },
  });

  const processVisMessagesLambda = createProcessVisMessagesLambda(
    secret,
    notifyTopic,
    sendRouteQueue,
    props,
    stack,
  );
  const scheduler = createProcessVisMessagesScheduler(stack);
  scheduler.addTarget(new LambdaFunction(processVisMessagesLambda));

  createUploadVoyagePlanLambda(secret, sendRouteQueue, rtzBucket, props, stack);
  createProcessDLQLambda(dlqBucket, dlq, props, stack);

  addDLQAlarm(dlq, props, stack);
}

function createProcessVisMessagesScheduler(stack: Stack): Rule {
  const ruleName = "VPGW-ProcessVisMessagesScheduler";
  return new Rule(stack, ruleName, {
    ruleName,
    schedule: Schedule.expression("cron(*/5 * * * ? *)"), // every 5 minutes
  });
}

function createProcessVisMessagesLambda(
  secret: ISecret,
  notifyTopic: Topic,
  sendRouteQueue: Queue,
  props: VoyagePlanGatewayProps,
  stack: DigitrafficStack,
): MonitoredFunction {
  const functionName = "VPGW-ProcessVisMessages";
  const environment: LambdaEnvironment = {};
  environment[VoyagePlanEnvKeys.SECRET_ID] = props.secretId;
  environment[VoyagePlanEnvKeys.QUEUE_URL] = sendRouteQueue.queueUrl;
  const lambdaConf = defaultLambdaConfiguration({
    functionName: functionName,
    memorySize: 128,
    timeout: 295, // almost 5 min
    reservedConcurrentExecutions: 2,
    code: new AssetCode("dist/lambda/process-vis-messages"),
    handler: "lambda-process-vis-messages.handler",
    environment,
  });
  const lambda = MonitoredFunction.create(stack, functionName, lambdaConf);
  secret.grantRead(lambda);
  notifyTopic.addSubscription(new LambdaSubscription(lambda));
  sendRouteQueue.grantSendMessages(lambda);

  return lambda;
}

// ATTENTION!
// This lambda needs to run in a VPC so that the outbound IP address is always the same (NAT Gateway).
// The reason for this is IP based restriction in another system's firewall.
function createUploadVoyagePlanLambda(
  secret: ISecret,
  sendRouteQueue: Queue,
  rtzBucket: Bucket,
  props: VoyagePlanGatewayProps,
  stack: DigitrafficStack,
): void {
  const functionName = "VPGW-UploadVoyagePlan";

  const environment: LambdaEnvironment = {};
  environment[VoyagePlanEnvKeys.SECRET_ID] = props.secretId;
  environment[VoyagePlanEnvKeys.BUCKET_NAME] = rtzBucket.bucketName;

  const lambdaConf = defaultLambdaConfiguration({
    functionName: functionName,
    code: new AssetCode("dist/lambda/upload-voyage-plan"),
    handler: "lambda-upload-voyage-plan.handler",
    reservedConcurrentExecutions: 3,
    timeout: 10,
    vpc: stack.vpc,
    environment,
  });
  const lambda = MonitoredFunction.create(stack, functionName, lambdaConf);
  secret.grantRead(lambda);
  lambda.addEventSource(
    new SqsEventSource(sendRouteQueue, {
      batchSize: 1,
    }),
  );
  rtzBucket.grantPut(lambda);

  new DigitrafficLogSubscriptions(stack, lambda);
}

function createProcessDLQLambda(
  dlqBucket: Bucket,
  dlq: Queue,
  props: VoyagePlanGatewayProps,
  stack: DigitrafficStack,
): void {
  const lambdaEnv: LambdaEnvironment = {};
  lambdaEnv[VoyagePlanEnvKeys.BUCKET_NAME] = dlqBucket.bucketName;
  const functionName = "VPGW-ProcessDLQ";
  const processDLQLambda = MonitoredFunction.create(stack, functionName, {
    runtime: Runtime.NODEJS_22_X,
    logRetention: RetentionDays.ONE_YEAR,
    functionName: functionName,
    code: new AssetCode("dist/lambda/process-dlq"),
    handler: "lambda-process-dlq.handler",
    environment: lambdaEnv,
    timeout: Duration.seconds(10),
    reservedConcurrentExecutions: 1,
    memorySize: 128,
  });

  processDLQLambda.addEventSource(new SqsEventSource(dlq));

  const statement = new PolicyStatement();
  statement.addActions("s3:PutObject");
  statement.addActions("s3:PutObjectAcl");
  statement.addResources(dlqBucket.bucketArn + "/*");
  processDLQLambda.addToRolePolicy(statement);
}

function addDLQAlarm(
  queue: Queue,
  appProps: VoyagePlanGatewayProps,
  stack: DigitrafficStack,
): void {
  const alarmName = "VPGW-DLQAlarm";
  queue
    .metricNumberOfMessagesReceived({
      period: appProps.dlqNotificationDuration,
    })
    .createAlarm(stack, alarmName, {
      alarmName,
      threshold: 0,
      evaluationPeriods: 1,
      treatMissingData: TreatMissingData.NOT_BREACHING,
      comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
    })
    .addAlarmAction(new SnsAction(stack.warningTopic));
}
