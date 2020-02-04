import {Construct} from '@aws-cdk/core';
import * as logs from '@aws-cdk/aws-logs';
import * as lambda from '@aws-cdk/aws-lambda';

export function createSubscription(lambda: lambda.Function, lambdaName: string, logDestinationArn: string, stack: Construct): logs.CfnSubscriptionFilter {
    const filter = new logs.CfnSubscriptionFilter(stack, `${lambdaName}LogsSubscription`, {
            logGroupName: `/aws/lambda/${lambdaName}`,
            filterPattern: '',
            destinationArn: logDestinationArn
        });

    filter.node.addDependency(lambda);

    return filter;
}