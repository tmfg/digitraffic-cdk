import {MobileServerProps} from "./app-props";
import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {ISecurityGroup, IVpc} from "@aws-cdk/aws-ec2";
import {Construct} from '@aws-cdk/core';
import {dbLambdaConfiguration} from "../../../common/stack/lambda-configs";
import {createSubscription} from "../../../common/stack/subscription";
import {KEY_SECRET_ID} from "./lambda/update-images/lambda-update-images";

export function create(
    secret: ISecret,
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: MobileServerProps,
    stack: Construct) {

    createUpdateImagesLambda(secret, vpc, lambdaDbSg, props, stack);
}

function createUpdateImagesLambda(secret: ISecret, vpc: IVpc, lambdaDbSg: ISecurityGroup, props: MobileServerProps, stack: Construct) {
    const environment: any = {};
    environment[KEY_SECRET_ID] = props.secretId;

    const functionName = "MSI-UpdateImages";
    const lambdaConf = dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        memorySize: 256,
        functionName: functionName,
        code: new AssetCode('dist/lambda/update-images'),
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
}
