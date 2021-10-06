import {Rule, Schedule} from '@aws-cdk/aws-events';
import {AssetCode} from '@aws-cdk/aws-lambda';
import {LambdaFunction} from '@aws-cdk/aws-events-targets';
import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {Bucket} from "@aws-cdk/aws-s3";
import {dbFunctionProps} from "digitraffic-common/stack/lambda-configs";
import {createSubscription} from "digitraffic-common/stack/subscription";
import {MarinecamEnvKeys} from "./keys";
import {DigitrafficStack} from "digitraffic-common/stack/stack";
import {MonitoredFunction} from "digitraffic-common/lambda/monitoredfunction";
import {TrafficType} from "digitraffic-common/model/traffictype";
import {MobileServerProps} from "./app-props";

export function create(
    stack: DigitrafficStack,
    secret: ISecret,
    bucket: Bucket) {

    const updateLambda = createUpdateImagesLambda(stack, secret, bucket);

    bucket.grantWrite(updateLambda);
}

function createUpdateImagesLambda(stack: DigitrafficStack,
                                  secret: ISecret,
                                  bucket: Bucket) {
    const environment = stack.createDefaultLambdaEnvironment('Marinecam');
    environment[MarinecamEnvKeys.BUCKET_NAME] = bucket.bucketName;

    const functionName = "Marinecam-UpdateImages";
    const lambdaConf = dbFunctionProps(stack, {
        memorySize: 128,
        functionName: functionName,
        reservedConcurrentExecutions: 1,
        code: new AssetCode('dist/lambda/update-images'),
        handler: 'lambda-update-images.handler',
        environment
    });
    const lambda = MonitoredFunction.create(stack, functionName, lambdaConf, TrafficType.MARINE);
    secret.grantRead(lambda);

    const rule = new Rule(stack, 'Rule', {
        schedule: Schedule.rate((stack.configuration as MobileServerProps).updateFrequency)
    });
    rule.addTarget(new LambdaFunction(lambda));
    createSubscription(lambda, functionName, stack.configuration.logsDestinationArn, stack);

    return lambda;
}
