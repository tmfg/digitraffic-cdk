import {Function,AssetCode} from '@aws-cdk/aws-lambda';
import {IVpc,ISecurityGroup} from '@aws-cdk/aws-ec2';
import {Stack} from '@aws-cdk/core';
import {dbLambdaConfiguration} from '../../common/stack/lambda-configs';
import {createSubscription} from '../../common/stack/subscription';
import {Props} from "./app-props";
import {Queue} from "@aws-cdk/aws-sqs";
import {SqsEventSource} from "@aws-cdk/aws-lambda-event-sources";

export function create(
    queue: Queue,
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: Props,
    stack: Stack) {

    const functionName = "PortcallEstimates-ProcessQueue";
    const lambdaConf = dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: functionName,
        code: new AssetCode('dist/lambda'),
        handler: 'lambda-process-queue.handler',
        environment: {
            DB_USER: props.dbProps.username,
            DB_PASS: props.dbProps.password,
            DB_URI: props.dbProps.uri,
            QUEUE_ARN: queue.queueArn
        }
    });

    const updateDisruptionsLambda = new Function(stack, functionName, lambdaConf);
    updateDisruptionsLambda.addEventSource(new SqsEventSource(queue));
    if(props.logsDestinationArn) {
        createSubscription(updateDisruptionsLambda, functionName, props.logsDestinationArn, stack);
    }
}
