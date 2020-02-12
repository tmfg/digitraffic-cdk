import {Construct} from '@aws-cdk/core';
import {CfnSubscriptionFilter} from '@aws-cdk/aws-logs';
import {Function} from '@aws-cdk/aws-lambda';

export function createSubscription(lambda: Function, lambdaName: string, logDestinationArn: string, stack: Construct): CfnSubscriptionFilter {
    const filter = new CfnSubscriptionFilter(stack, `${lambdaName}LogsSubscription`, {
            logGroupName: `/aws/lambda/${lambdaName}`,
            filterPattern: '',
            destinationArn: logDestinationArn
        });

    filter.node.addDependency(lambda);

    return filter;
}