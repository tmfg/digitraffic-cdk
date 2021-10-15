import {Construct} from '@aws-cdk/core';
import {CfnSubscriptionFilter} from '@aws-cdk/aws-logs';
import {Function} from '@aws-cdk/aws-lambda';
import {DigitrafficStack} from "./stack";
import {MonitoredFunction} from "../lambda/monitoredfunction";

/**
 * Creates a subscription filter that subscribes to a Lambda Log Group and delivers the logs to another destination.
 * https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-logs-subscriptionfilter.html
 * @param lambda The Lambda function, needed to create a dependency
 * @param lambdaName The Lambda name from which the Log Group name is derived
 * @param logDestinationArn Destination for streamed logs
 * @param stack CloudFormation stack
 */
export function createSubscription(lambda: Function, lambdaName: string, logDestinationArn: string, stack: Construct): CfnSubscriptionFilter {
    const filter = new CfnSubscriptionFilter(stack, `${lambdaName}LogsSubscription`, {
            logGroupName: `/aws/lambda/${lambdaName}`,
            filterPattern: '',
            destinationArn: logDestinationArn
        });

    filter.node.addDependency(lambda);

    return filter;
}

export class DigitrafficLogSubscriptions {
    constructor(stack: DigitrafficStack, ...lambdas: MonitoredFunction[]) {
        lambdas.forEach(lambda => {
            const filter = new CfnSubscriptionFilter(stack, `${lambda.givenName}LogsSubscription`, {
                logGroupName: `/aws/lambda/${lambda.givenName}`,
                filterPattern: '',
                destinationArn: stack.configuration.logsDestinationArn
            });

            filter.node.addDependency(lambda);
        });
    }
}
