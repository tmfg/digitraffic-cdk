import {Stack} from '@aws-cdk/core';
import * as logs from '@aws-cdk/aws-logs';

export function create(lambdaNames: string[], props: Props, stack: Stack) {

    lambdaNames.forEach((lambdaName) =>
        new logs.CfnSubscriptionFilter(stack, `${lambdaName}LogsSubscription`, {
            logGroupName: `/aws/lambda/${lambdaName}`,
            filterPattern: '',
            destinationArn: props.logsDestinationArn
        })
    );

}