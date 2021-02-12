import {AssetCode, Function, FunctionProps, Runtime} from '@aws-cdk/aws-lambda';
import {Duration, Stack} from '@aws-cdk/core';
import {createSubscription} from '../../common/stack/subscription';
import {Props} from './app-props';
import {RetentionDays} from "@aws-cdk/aws-logs";
import {PolicyStatement} from "@aws-cdk/aws-iam";
import {Bucket} from "@aws-cdk/aws-s3";
import {KEY_BUCKET_NAME, KEY_REGION, KEY_APP_URL, KEY_APP_BETA_URL, KEY_APIGW_APPS} from "./lambda/update-swagger/lambda-update-swagger";
import {KEY_APIGW_IDS} from "./lambda/update-api-documentation/lambda-update-api-documentation";
import {Rule, Schedule} from "@aws-cdk/aws-events";
import {LambdaFunction} from "@aws-cdk/aws-events-targets";

export function create(
    bucket: Bucket,
    props: Props, stack: Stack
) {

    createUpdateSwaggerDescriptionsLambda(bucket, props, stack);
    createUpdateApiDocumentationLambda(props, stack);
}

function createUpdateApiDocumentationLambda(
    props: Props,
    stack: Stack
) {
    const functionName = `${stack.stackName}-UpdateApiDocumentation`;

    const lambdaEnv: any = {};
    lambdaEnv[KEY_REGION] = stack.region;
    lambdaEnv[KEY_APIGW_IDS] = JSON.stringify(props.apiGwAppIds);

    const lambdaConf: FunctionProps = {
        functionName: functionName,
        logRetention: RetentionDays.ONE_YEAR,
        code: new AssetCode('dist/lambda/update-api-documentation'),
        handler: 'lambda-update-api-documentation.handler',
        runtime: Runtime.NODEJS_12_X,
        environment: lambdaEnv
    };

    const updateDocsLambda = new Function(stack, functionName, lambdaConf);

    const statement = new PolicyStatement();
    statement.addActions('apigateway:GET', 'apigateway:POST', 'apigateway:PUT', 'apigateway:PATCH');
    statement.addResources('*');

    updateDocsLambda.addToRolePolicy(statement);

    createSubscription(updateDocsLambda, functionName, props.logsDestinationArn, stack);
}

function createUpdateSwaggerDescriptionsLambda(
    bucket: Bucket,
    props: Props,
    stack: Stack
) {
    const functionName = `${stack.stackName}-UpdateSwaggerDescriptions`;

    const lambdaEnv: any = {};
    lambdaEnv[KEY_BUCKET_NAME] = bucket.bucketName;
    lambdaEnv[KEY_REGION] = stack.region;
    lambdaEnv[KEY_APIGW_APPS] = JSON.stringify(props.apiGwAppIds);
    lambdaEnv[KEY_APP_URL] = props.appUrl;
    if (props.betaAppUrl) {
        lambdaEnv[KEY_APP_BETA_URL] = props.betaAppUrl;
    }

    const lambdaConf: FunctionProps = {
        functionName: functionName,
        logRetention: RetentionDays.ONE_YEAR,
        code: new AssetCode('dist/lambda/update-swagger'),
        handler: 'lambda-update-swagger.handler',
        runtime: Runtime.NODEJS_12_X,
        memorySize: 192,
        environment: lambdaEnv
    };

    const updateSwaggerLambda = new Function(stack, functionName, lambdaConf);

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
        ruleName
    });
    rule.addTarget(new LambdaFunction(updateSwaggerLambda));
}
