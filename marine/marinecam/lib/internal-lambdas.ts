import {Rule, Schedule} from '@aws-cdk/aws-events';
import {LambdaFunction} from '@aws-cdk/aws-events-targets';
import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {Bucket} from "@aws-cdk/aws-s3";
import {databaseFunctionProps} from "digitraffic-common/stack/lambda-configs";
import {DigitrafficLogSubscriptions} from "digitraffic-common/stack/subscription";
import {MarinecamEnvKeys} from "./keys";
import {DigitrafficStack} from "digitraffic-common/stack/stack";
import {MonitoredFunction} from "digitraffic-common/lambda/monitoredfunction";
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
    const lambdaConf = databaseFunctionProps(stack, environment, functionName, 'update-images');
    const lambda = MonitoredFunction.create(stack, functionName, lambdaConf);
    secret.grantRead(lambda);

    const rule = new Rule(stack, 'Rule', {
        schedule: Schedule.rate((stack.configuration as MobileServerProps).updateFrequency)
    });
    rule.addTarget(new LambdaFunction(lambda));

    new DigitrafficLogSubscriptions(stack, lambda);

    return lambda;
}
