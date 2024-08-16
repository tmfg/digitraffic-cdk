import { CfnSubscriptionFilter } from "aws-cdk-lib/aws-logs";
import { Function as AWSFunction } from "aws-cdk-lib/aws-lambda";
import { DigitrafficStack } from "./stack.js";
import { Construct } from "constructs";
import { MonitoredFunction } from "./monitoredfunction.js";

/**
 * Creates a subscription filter that subscribes to a Lambda Log Group and delivers the logs to another destination.
 * https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-logs-subscriptionfilter.html
 * @param lambda The Lambda function, needed to create a dependency
 * @param lambdaName The Lambda name from which the Log Group name is derived
 * @param logDestinationArn Destination for streamed logs
 * @param stack CloudFormation stack
 */
export function createSubscription(
    lambda: AWSFunction,
    lambdaName: string,
    logDestinationArn: string | undefined,
    stack: Construct
): CfnSubscriptionFilter | undefined {
    if (logDestinationArn == undefined) {
        return undefined;
    }
    const filter = new CfnSubscriptionFilter(
        stack,
        `${lambdaName}LogsSubscription`,
        {
            logGroupName: `/aws/lambda/${lambdaName}`,
            filterPattern: "",
            destinationArn: logDestinationArn,
        }
    );

    filter.node.addDependency(lambda);

    return filter;
}

export class DigitrafficLogSubscriptions {
    constructor(stack: DigitrafficStack, ...lambdas: MonitoredFunction[]) {
        const destinationArn = stack.configuration.logsDestinationArn;
        if (destinationArn !== undefined) {
            lambdas.forEach((lambda) => {
                const filter = new CfnSubscriptionFilter(
                    stack,
                    `${lambda.givenName}LogsSubscription`,
                    {
                        logGroupName: `/aws/lambda/${lambda.givenName}`,
                        filterPattern: "",
                        destinationArn,
                    }
                );

                filter.node.addDependency(lambda);
            });
        }
    }
}
