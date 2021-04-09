import {Rule,Schedule} from '@aws-cdk/aws-events';
import {Function,AssetCode} from '@aws-cdk/aws-lambda';
import {LambdaFunction} from '@aws-cdk/aws-events-targets';
import {Duration} from '@aws-cdk/core';
import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {ISecurityGroup, IVpc} from "@aws-cdk/aws-ec2";
import {Construct} from '@aws-cdk/core';
import {Bucket} from "@aws-cdk/aws-s3";

import {MobileServerProps} from "./app-props";
import {dbLambdaConfiguration} from "../../../common/stack/lambda-configs";
import {createSubscription} from "../../../common/stack/subscription";
import {KEY_BUCKET_NAME, KEY_SECRET_ID} from "./lambda/update-images/lambda-update-images";

export function create(
    secret: ISecret,
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: MobileServerProps,
    bucket: Bucket,
    stack: Construct) {

    const updateLambda = createUpdateImagesLambda(secret, vpc, lambdaDbSg, props, stack, bucket);

    bucket.grantWrite(updateLambda);
}

function createUpdateImagesLambda(secret: ISecret, vpc: IVpc, lambdaDbSg: ISecurityGroup, props: MobileServerProps, stack: Construct, bucket: Bucket) {
    const environment: any = {};
    environment[KEY_SECRET_ID] = props.secretId;
    environment[KEY_BUCKET_NAME] = bucket.bucketName;

    const functionName = "Marinecam-UpdateImages";
    const lambdaConf = dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        memorySize: 256,
        functionName: functionName,
        code: new AssetCode('dist/lambda/'),
        handler: 'lambda-update-images.handler',
        environment
    });
    const lambda = new Function(stack, functionName, lambdaConf);
    secret.grantRead(lambda);
    const rule = new Rule(stack, 'Rule', {
        schedule: Schedule.rate(Duration.minutes(10))
    });
    rule.addTarget(new LambdaFunction(lambda));
    createSubscription(lambda, functionName, props.logsDestinationArn, stack);

    return lambda;
}
