import {AssetCode, Function, FunctionProps, Runtime} from '@aws-cdk/aws-lambda';
import {Stack} from '@aws-cdk/core';
import {createSubscription} from '../../common/stack/subscription';
import {Props} from './app-props';
import {RetentionDays} from "@aws-cdk/aws-logs";
import {PolicyStatement} from "@aws-cdk/aws-iam";
import {Bucket} from "@aws-cdk/aws-s3";
import {KEY_BUCKET_NAME, KEY_REGION} from "./lambda/update-swagger/lambda-update-swagger";

export function create(
    bucket: Bucket,
    props: Props,
    stack: Stack) {
    const functionName = `${stack.stackName}-UpdateSwaggerDescriptions`;
    const lambdaEnv: any = {};
    lambdaEnv[KEY_BUCKET_NAME] = bucket.bucketName;
    lambdaEnv[KEY_REGION] = stack.region;
    const lambdaConf: FunctionProps = {
        functionName: functionName,
        logRetention: RetentionDays.ONE_YEAR,
        code: new AssetCode('dist/lambda'),
        handler: 'lambda-update-swagger.handler',
        runtime: Runtime.NODEJS_12_X,
        environment: lambdaEnv
    };

    const updateFaultsLambda = new Function(stack, 'UpdateFaults', lambdaConf);

    const statement = new PolicyStatement();
    statement.addActions('apigateway:GET');
    statement.addResources('*');

    statement.addActions('s3:PutObject');
    statement.addActions('s3:PutObjectAcl');
    statement.addResources(bucket.bucketArn);

    updateFaultsLambda.addToRolePolicy(statement);

    createSubscription(updateFaultsLambda, functionName, props.logsDestinationArn, stack);
}
