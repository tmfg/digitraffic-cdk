import {Function,AssetCode,Runtime} from '@aws-cdk/aws-lambda';
import {IVpc,ISecurityGroup} from '@aws-cdk/aws-ec2';
import {Stack} from '@aws-cdk/core';
import {dbLambdaConfiguration} from '../../../../common/stack/lambda-configs';
import {createSubscription} from '../../../../common/stack/subscription';
import {Props} from "./app-props-estimates";
import {Queue} from "@aws-cdk/aws-sqs";
import {SqsEventSource} from "@aws-cdk/aws-lambda-event-sources";
import {Bucket} from "@aws-cdk/aws-s3";
import {BUCKET_NAME} from "./lambda/process-dlq/lambda-process-dlq";
import {RetentionDays} from '@aws-cdk/aws-logs';
import {QueueAndDLQ} from "./sqs";
import {PolicyStatement} from "@aws-cdk/aws-iam";
import {Topic} from "@aws-cdk/aws-sns";
import {Rule, Schedule} from "@aws-cdk/aws-events";
import {LambdaFunction} from "@aws-cdk/aws-events-targets";

export function create(
    queueAndDLQ: QueueAndDLQ,
    dlqBucket: Bucket,
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: Props,
    stack: Stack) {

    const estimatesUpdatedTopicId = 'PortcallEstimatesUpdatedTopic';
    const estimatesUpdatedTopic = new Topic(stack, estimatesUpdatedTopicId, {
        displayName: estimatesUpdatedTopicId,
        topicName: estimatesUpdatedTopicId
    });
    createProcessQueueLambda(queueAndDLQ.queue, estimatesUpdatedTopic, vpc, lambdaDbSg, props, stack);
    createProcessDLQLambda(dlqBucket, queueAndDLQ.dlq, props, stack);

    const updateETAEstimatesLambda = createUpdateETAEstimatesLambda(vpc, lambdaDbSg, props, stack);
    const updateETASchedulingRule = createETAUpdateSchedulingCloudWatchRule(stack);
    updateETASchedulingRule.addTarget(new LambdaFunction(updateETAEstimatesLambda));
}

function createProcessQueueLambda(
    queue: Queue,
    estimatesUpdatedTopic: Topic,
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: Props,
    stack: Stack) {
    const functionName = "PortcallEstimates-ProcessQueue";
    const lambdaConf = dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: functionName,
        code: new AssetCode('dist/estimates/lambda/process-queue'),
        handler: 'lambda-process-queue.handler',
        environment: {
            DB_USER: props.dbProps.username,
            DB_PASS: props.dbProps.password,
            DB_URI: props.dbProps.uri,
            ESTIMATE_SNS_TOPIC_ARN: estimatesUpdatedTopic.topicArn
        },
        reservedConcurrentExecutions: props.sqsProcessLambdaConcurrentExecutions
    });
    const processQueueLambda = new Function(stack, functionName, lambdaConf);
    processQueueLambda.addEventSource(new SqsEventSource(queue));
    estimatesUpdatedTopic.grantPublish(processQueueLambda);
    createSubscription(processQueueLambda, functionName, props.logsDestinationArn, stack);
}

function createProcessDLQLambda(
    dlqBucket: Bucket,
    dlq: Queue,
    props: Props,
    stack: Stack) {
    const lambdaEnv: any = {};
    lambdaEnv[BUCKET_NAME] = dlqBucket.bucketName;
    const functionName = "PortcallEstimates-ProcessDLQ";
    const processDLQLambda = new Function(stack, functionName, {
        runtime: Runtime.NODEJS_12_X,
        logRetention: RetentionDays.ONE_YEAR,
        functionName: functionName,
        code: new AssetCode('dist/estimates/lambda/process-dlq'),
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
    const ruleName = 'PortcallEstimates-ETAScheduler'
    return new Rule(stack, ruleName, {
        ruleName,
        schedule: Schedule.expression('cron(*/15 * * * ? *)') // every 15 minutes
    });
}

function createUpdateETAEstimatesLambda(
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: Props,
    stack: Stack): Function {

    const functionName = "PortcallEstimates-UpdateETAEstimates";
    const lambdaConf = dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: functionName,
        code: new AssetCode('dist/estimates/lambda/update-eta-estimates'),
        handler: 'lambda-update-eta-estimates.handler',
        environment: {
            DB_USER: props.dbProps.username,
            DB_PASS: props.dbProps.password,
            DB_URI: props.dbProps.uri
        },
        reservedConcurrentExecutions: props.sqsProcessLambdaConcurrentExecutions
    });
    const lambda = new Function(stack, functionName, lambdaConf);
    createSubscription(lambda, functionName, props.logsDestinationArn, stack);
    return lambda;
}