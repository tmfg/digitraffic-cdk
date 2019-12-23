import {Stack} from '@aws-cdk/core';
import * as logs from '@aws-cdk/aws-logs';

export function create(lambdaNames: string[], logDestinationArn: string, stack: Stack) {

    lambdaNames.forEach((lambdaName) =>
        new logs.CfnSubscriptionFilter(stack, `${lambdaName}LogsSubscription`, {
            logGroupName: `/aws/lambda/${lambdaName}`,
            filterPattern: '',
            destinationArn: logDestinationArn
        })
    );

}