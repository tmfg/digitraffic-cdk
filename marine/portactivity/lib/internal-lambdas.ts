import {AssetCode, Function, Runtime} from '@aws-cdk/aws-lambda';
import {ISecurityGroup, IVpc} from '@aws-cdk/aws-ec2';
import {Stack} from '@aws-cdk/core';
import {dbLambdaConfiguration} from '../../../common/stack/lambda-configs';
import {createSubscription} from '../../../common/stack/subscription';
import {Props} from "./app-props";
import {Queue} from "@aws-cdk/aws-sqs";
import {SqsEventSource} from "@aws-cdk/aws-lambda-event-sources";
import {Bucket} from "@aws-cdk/aws-s3";
import {BUCKET_NAME} from "./lambda/process-dlq/lambda-process-dlq";
import {RetentionDays} from '@aws-cdk/aws-logs';
import {QueueAndDLQ} from "./sqs";
import {PolicyStatement} from "@aws-cdk/aws-iam";
import {Rule, Schedule} from "@aws-cdk/aws-events";
import {LambdaFunction} from "@aws-cdk/aws-events-targets";
import {
    KEY_ENDPOINT_AUDIENCE,
    KEY_ENDPOINT_AUTH_URL,
    KEY_ENDPOINT_CLIENT_ID,
    KEY_ENDPOINT_CLIENT_SECRET,
    KEY_ENDPOINT_URL,
    KEY_ESTIMATE_SOURCE
} from "./lambda/update-eta-timestamps/lambda-update-eta-timestamps";
import {ISecret} from "@aws-cdk/aws-secretsmanager";

export function create(
    queueAndDLQ: QueueAndDLQ,
    dlqBucket: Bucket,
    secret: ISecret,
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: Props,
    stack: Stack) {

    createProcessQueueLambda(queueAndDLQ.queue, secret, vpc, lambdaDbSg, props, stack);
    createProcessDLQLambda(dlqBucket, queueAndDLQ.dlq, props, stack);

    const updateETATimestampsLambda = createUpdateETATimestampsLambda(secret, vpc, lambdaDbSg, props, stack);
    const updateETASchedulingRule = createETAUpdateSchedulingCloudWatchRule(stack);
    updateETASchedulingRule.addTarget(new LambdaFunction(updateETATimestampsLambda));

    if(props.teqplayUrl) {
        const updateTimestampsFromTeqplayLambda = createUpdateTimestampsFromTeqplayLambda(secret, queueAndDLQ.queue, vpc, props, stack);
        const teqplayScheduler = createTeqplayScheduler(stack);
        teqplayScheduler.addTarget(new LambdaFunction(updateTimestampsFromTeqplayLambda));
    }
}

function createUpdateTimestampsFromTeqplayLambda(secret: ISecret, queue: Queue, vpc: IVpc, props: Props, stack: Stack): Function {
    const functionName = 'PortActivity-UpdateTimestampsFromTeqplay';

    const lambda = new Function(stack, functionName, {
        runtime: Runtime.NODEJS_12_X,
        logRetention: RetentionDays.ONE_YEAR,
        functionName: functionName,
        code: new AssetCode('dist/lambda/update-timestamps-from-teqplay'),
        handler: 'lambda-update-timestamps-from-teqplay.handler',
        environment: {
            SECRET_ID: props.secretId,
            ESTIMATE_SQS_QUEUE_URL: queue.queueUrl
        }
    });

    createSubscription(lambda, functionName, props.logsDestinationArn, stack);
    queue.grantSendMessages(lambda);

    secret.grantRead(lambda);

    return lambda;
}

function createProcessQueueLambda(
    queue: Queue,
    secret: ISecret,
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: Props,
    stack: Stack) {
    const functionName = "PortActivity-ProcessTimestampQueue";
    const lambdaConf = dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: functionName,
        memorySize: 128,
        code: new AssetCode('dist/lambda/process-queue'),
        handler: 'lambda-process-queue.handler',
        environment: {
            SECRET_ID: props.secretId
        },
        reservedConcurrentExecutions: props.sqsProcessLambdaConcurrentExecutions
    });
    const processQueueLambda = new Function(stack, functionName, lambdaConf);
    secret.grantRead(processQueueLambda);
    processQueueLambda.addEventSource(new SqsEventSource(queue));
    createSubscription(processQueueLambda, functionName, props.logsDestinationArn, stack);
}

function createProcessDLQLambda(
    dlqBucket: Bucket,
    dlq: Queue,
    props: Props,
    stack: Stack) {
    const lambdaEnv: any = {};
    lambdaEnv[BUCKET_NAME] = dlqBucket.bucketName;
    const functionName = "PortActivity-ProcessTimestampsDLQ";
    const processDLQLambda = new Function(stack, functionName, {
        runtime: Runtime.NODEJS_12_X,
        logRetention: RetentionDays.ONE_YEAR,
        functionName: functionName,
        code: new AssetCode('dist/lambda/process-dlq'),
        handler: 'lambda-process-dlq.handler',
        environment: lambdaEnv,
        reservedConcurrentExecutions: props.sqsProcessLambdaConcurrentExecutions
    });

    processDLQLambda.addEventSource(new SqsEventSource(dlq));
    createSubscription(processDLQLambda, functionName, props.logsDestinationArn, stack);

    const statement = new PolicyStatement();
    statement.addActions('s3:PutObject');
    statement.addActions('s3:PutObjectAcl');
    statement.addResources(dlqBucket.bucketArn + '/*');
    processDLQLambda.addToRolePolicy(statement);
}

function createETAUpdateSchedulingCloudWatchRule(stack: Stack): Rule {
    const ruleName = 'PortActivity-ETAScheduler'
    return new Rule(stack, ruleName, {
        ruleName,
        schedule: Schedule.expression('cron(*/15 * * * ? *)') // every 15 minutes
    });
}

function createTeqplayScheduler(stack: Stack): Rule {
    const ruleName = 'PortActivity-TeqplayScheduler'
    return new Rule(stack, ruleName, {
        ruleName,
        schedule: Schedule.expression('cron(*/2 * * * ? *)') // every 15 minutes
    });
}

function createUpdateETATimestampsLambda(
    secret: ISecret,
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: Props,
    stack: Stack): Function {

    const environment: any = {
        SECRET_ID: props.secretId
    };
    environment[KEY_ENDPOINT_CLIENT_ID] = props.etaProps.clientId;
    environment[KEY_ENDPOINT_CLIENT_SECRET] = props.etaProps.clientSecret;
    environment[KEY_ENDPOINT_AUDIENCE] = props.etaProps.audience;
    environment[KEY_ENDPOINT_AUTH_URL] = props.etaProps.authUrl;
    environment[KEY_ENDPOINT_URL] = props.etaProps.endpointUrl;
    environment[KEY_ESTIMATE_SOURCE] = props.etaProps.timestampSource;

    const functionName = 'PortActivity-UpdateETATimestamps';
    const lambdaConf = dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: functionName,
        memorySize: 256,
        code: new AssetCode('dist/lambda/update-eta-timestamps'),
        handler: 'lambda-update-eta-timestamps.handler',
        environment,
        reservedConcurrentExecutions: props.sqsProcessLambdaConcurrentExecutions
    });
    const lambda = new Function(stack, functionName, lambdaConf);
    secret.grantRead(lambda);
    createSubscription(lambda, functionName, props.logsDestinationArn, stack);
    return lambda;
}