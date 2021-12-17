import {AssetCode, Function, FunctionProps, Runtime} from 'aws-cdk-lib/aws-lambda';
import {Duration, Stack} from 'aws-cdk-lib';
import {createSubscription} from 'digitraffic-common/stack/subscription';
import {Props} from './app-props';
import {RetentionDays} from "aws-cdk-lib/aws-logs";
import {PolicyStatement} from "aws-cdk-lib/aws-iam";
import {Bucket} from "aws-cdk-lib/aws-s3";
import {
    KEY_BUCKET_NAME,
    KEY_REGION,
    KEY_APP_URL,
    KEY_APP_BETA_URL,
    KEY_APIGW_APPS,
    KEY_DIRECTORY,
    KEY_HOST,
    KEY_TITLE,
    KEY_DESCRIPTION,
    KEY_REMOVESECURITY,
} from "./lambda/update-swagger/lambda-update-swagger";
import {KEY_APIGW_IDS} from "./lambda/update-api-documentation/lambda-update-api-documentation";
import {Rule, Schedule} from "aws-cdk-lib/aws-events";
import {LambdaFunction} from "aws-cdk-lib/aws-events-targets";
import {MonitoredFunction} from "digitraffic-common/lambda/monitoredfunction";
import {DigitrafficStack} from "digitraffic-common/stack/stack";

export function create(stack: DigitrafficStack,
    bucket: Bucket) {

    createUpdateSwaggerDescriptionsLambda(stack, bucket);
    createUpdateApiDocumentationLambda(stack);
}

function createUpdateApiDocumentationLambda(stack: DigitrafficStack) {
    const functionName = `${stack.stackName}-UpdateApiDocumentation`;
    const props = stack.configuration as Props;

    const lambdaEnv: any = {};
    lambdaEnv[KEY_REGION] = stack.region;
    lambdaEnv[KEY_APIGW_IDS] = JSON.stringify(props.apiGwAppIds);

    const lambdaConf: FunctionProps = {
        functionName: functionName,
        logRetention: RetentionDays.ONE_YEAR,
        code: new AssetCode('dist/lambda/update-api-documentation'),
        handler: 'lambda-update-api-documentation.handler',
        runtime: Runtime.NODEJS_12_X,
        environment: lambdaEnv,
        reservedConcurrentExecutions: 1,
        memorySize: 128,
        timeout: Duration.seconds(10),
    };

    const updateDocsLambda = MonitoredFunction.create(stack, functionName, lambdaConf);

    const statement = new PolicyStatement();
    statement.addActions('apigateway:GET', 'apigateway:POST', 'apigateway:PUT', 'apigateway:PATCH');
    statement.addResources('*');

    updateDocsLambda.addToRolePolicy(statement);

    createSubscription(updateDocsLambda, functionName, props.logsDestinationArn, stack);
}

function createUpdateSwaggerDescriptionsLambda(stack: DigitrafficStack, bucket: Bucket) {
    const functionName = `${stack.stackName}-UpdateSwaggerDescriptions`;
    const props = stack.configuration as Props;

    const lambdaEnv: any = {};
    lambdaEnv[KEY_BUCKET_NAME] = bucket.bucketName;
    lambdaEnv[KEY_REGION] = stack.region;
    lambdaEnv[KEY_APIGW_APPS] = JSON.stringify(props.apiGwAppIds);
    lambdaEnv[KEY_APP_URL] = props.appUrl;
    if (props.betaAppUrl) {
        lambdaEnv[KEY_APP_BETA_URL] = props.betaAppUrl;
    }
    if (props.directory) {
        lambdaEnv[KEY_DIRECTORY] = props.directory;
    }
    if (props.host) {
        lambdaEnv[KEY_HOST] = props.host;
    }
    if (props.title) {
        lambdaEnv[KEY_TITLE] = props.title;
    }
    if (props.description) {
        lambdaEnv[KEY_DESCRIPTION] = props.description;
    }
    if (props.removeSecurity) {
        lambdaEnv[KEY_REMOVESECURITY] = 'true';
    }

    const lambdaConf: FunctionProps = {
        functionName: functionName,
        logRetention: RetentionDays.ONE_YEAR,
        code: new AssetCode('dist/lambda/update-swagger'),
        handler: 'lambda-update-swagger.handler',
        runtime: Runtime.NODEJS_12_X,
        memorySize: 192,
        reservedConcurrentExecutions: 1,
        environment: lambdaEnv,
        timeout: Duration.seconds(10),
    };

    const updateSwaggerLambda = MonitoredFunction.create(stack, functionName, lambdaConf);

    const statement = new PolicyStatement();
    statement.addActions('apigateway:GET');
    statement.addResources('*');

    statement.addActions('s3:PutObject');
    statement.addActions('s3:PutObjectAcl');
    statement.addResources(bucket.bucketArn);

    updateSwaggerLambda.addToRolePolicy(statement);

    createSubscription(updateSwaggerLambda, functionName, props.logsDestinationArn, stack);

    const ruleName = `${stack.stackName}-UpdateSwaggerRule`;
    const rule = new Rule(stack, ruleName, {
        schedule: Schedule.rate(Duration.hours(1)),
        ruleName,
    });
    rule.addTarget(new LambdaFunction(updateSwaggerLambda));
}
