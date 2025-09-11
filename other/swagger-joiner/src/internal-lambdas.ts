import { AssetCode, type FunctionProps, Runtime } from "aws-cdk-lib/aws-lambda";
import { Duration } from "aws-cdk-lib";
import { type Props } from "./app-props.js";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { type Bucket } from "aws-cdk-lib/aws-s3";
import { createLambdaLogGroup } from "@digitraffic/common/dist/aws/infra/stack/lambda-log-group";
import { KEY_APIGW_IDS } from "./lambda/update-api-documentation/lambda-update-api-documentation.js";
import { Rule, Schedule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { MonitoredFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import { type DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { type LambdaEnvironment } from "@digitraffic/common/dist/aws/infra/stack/lambda-configs";
import { UPDATE_SWAGGER_KEYS } from "./model/keys.js";

export function create(stack: DigitrafficStack, bucket: Bucket): void {
  createUpdateSwaggerDescriptionsLambda(stack, bucket);
  createUpdateApiDocumentationLambda(stack);
}

function createUpdateApiDocumentationLambda(stack: DigitrafficStack): void {
  const functionName = `${stack.stackName}-UpdateApiDocumentation`;
  const props = stack.configuration as Props;

  const lambdaEnv: LambdaEnvironment = {};
  lambdaEnv[UPDATE_SWAGGER_KEYS.REGION] = stack.region;
  lambdaEnv[KEY_APIGW_IDS] = JSON.stringify(props.apiGwAppIds);

  const logGroup = createLambdaLogGroup({ stack, functionName });

  const lambdaConf: FunctionProps = {
    functionName: functionName,
    logGroup: logGroup,
    code: new AssetCode("dist/lambda/update-api-documentation"),
    handler: "lambda-update-api-documentation.handler",
    runtime: Runtime.NODEJS_22_X,
    environment: lambdaEnv,
    reservedConcurrentExecutions: 1,
    memorySize: 128,
    timeout: Duration.seconds(30),
  };

  const updateDocsLambda = MonitoredFunction.create(
    stack,
    functionName,
    lambdaConf,
  );

  const statement = new PolicyStatement();
  statement.addActions(
    "apigateway:GET",
    "apigateway:POST",
    "apigateway:PUT",
    "apigateway:PATCH",
  );
  statement.addResources("*");

  updateDocsLambda.addToRolePolicy(statement);
}

function createUpdateSwaggerDescriptionsLambda(
  stack: DigitrafficStack,
  bucket: Bucket,
): void {
  const functionName = `${stack.stackName}-UpdateSwaggerDescriptions`;
  const props = stack.configuration as Props;

  const lambdaEnv: LambdaEnvironment = {};
  lambdaEnv[UPDATE_SWAGGER_KEYS.BUCKET_NAME] = bucket.bucketName;
  lambdaEnv[UPDATE_SWAGGER_KEYS.REGION] = stack.region;
  lambdaEnv[UPDATE_SWAGGER_KEYS.APIGW_APPS] = JSON.stringify(props.apiGwAppIds);
  if (props.appUrl) {
    lambdaEnv[UPDATE_SWAGGER_KEYS.APP_URL] = props.appUrl;
  }
  if (props.betaAppUrl) {
    lambdaEnv[UPDATE_SWAGGER_KEYS.APP_BETA_URL] = props.betaAppUrl;
  }
  if (props.directory) {
    lambdaEnv[UPDATE_SWAGGER_KEYS.DIRECTORY] = props.directory;
  }
  if (props.host) {
    lambdaEnv[UPDATE_SWAGGER_KEYS.HOST] = props.host;
  }
  if (props.title) {
    lambdaEnv[UPDATE_SWAGGER_KEYS.TITLE] = props.title;
  }
  if (props.description) {
    lambdaEnv[UPDATE_SWAGGER_KEYS.DESCRIPTION] = props.description;
  }
  if (props.removeSecurity) {
    lambdaEnv[UPDATE_SWAGGER_KEYS.REMOVESECURITY] = "true";
  }

  const logGroup = createLambdaLogGroup({ stack, functionName });

  const lambdaConf: FunctionProps = {
    functionName: functionName,
    logGroup: logGroup,
    code: new AssetCode("dist/lambda/update-swagger"),
    handler: "lambda-update-swagger.handler",
    runtime: Runtime.NODEJS_22_X,
    memorySize: 192,
    reservedConcurrentExecutions: 1,
    environment: lambdaEnv,
    timeout: Duration.seconds(30),
  };

  const updateSwaggerLambda = MonitoredFunction.create(
    stack,
    functionName,
    lambdaConf,
  );

  const statement = new PolicyStatement();
  statement.addActions("apigateway:GET");
  statement.addResources("*");

  statement.addActions("s3:PutObject");
  statement.addActions("s3:PutObjectAcl");
  statement.addResources(bucket.bucketArn);

  updateSwaggerLambda.addToRolePolicy(statement);

  const ruleName = `${stack.stackName}-UpdateSwaggerRule`;
  const rule = new Rule(stack, ruleName, {
    schedule: Schedule.rate(Duration.hours(1)),
    ruleName,
  });
  rule.addTarget(new LambdaFunction(updateSwaggerLambda));
}
