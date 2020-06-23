import {Rule,Schedule} from '@aws-cdk/aws-events';
import {RetentionDays} from "@aws-cdk/aws-logs";
import {Function,AssetCode,Runtime} from '@aws-cdk/aws-lambda';
import {LambdaFunction} from '@aws-cdk/aws-events-targets';
import {Stack, Duration} from '@aws-cdk/core';
import {createSubscription} from '../../common/stack/subscription';
import {Props} from "./app-props";

export function create(props: Props, stack: Stack) {

    const functionName = "Status-UpdateStatuses";
    const lambdaConf = {
        functionName: functionName,
        code: new AssetCode('dist/lambda/update-statuses'),
        handler: 'lambda-update-statuses.handler',
        runtime: Runtime.NODEJS_12_X,
        memorySize: 1024,
        timeout: Duration.seconds(props.defaultLambdaDurationSeconds),
        environment: {
            APP: props.app,
            NODEPING_TOKEN: props.nodepingToken,
            NODEPING_SUBACCOUNT_ID: props.nodepingSubAccountId,
            STATUSPAGE_PAGE_ID: props.statuspagePageId,
            STATUSPAGE_COMPONENT_GROUP_ID: props.statusPageComponentGroupId,
            STATUSPAGE_API_KEY: props.statuspageApiKey
        },
        logRetention: RetentionDays.ONE_YEAR,
    };

    const updateStatusesLambda = new Function(stack, 'UpdateStatuses', lambdaConf);

    const rule = new Rule(stack, 'Rule', {
        schedule: Schedule.rate(Duration.minutes(10))
    });
    rule.addTarget(new LambdaFunction(updateStatusesLambda));

    createSubscription(updateStatusesLambda, functionName, props.logsDestinationArn, stack);
}
