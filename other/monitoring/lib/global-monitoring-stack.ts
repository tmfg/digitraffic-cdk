import { Stack } from "aws-cdk-lib";
import { Topic } from "aws-cdk-lib/aws-sns";
import { Construct } from "constructs";
import { MonitoringConfiguration } from "./app-props";
import { CloudfrontMonitoring } from "./cloudfront-monitoring";
import { Route53Monitoring } from "./route53-monitoring";

/**
 * Creates a new stack for all monitoring that must be placed in us-east-1:
 * * Route53 changes for given zones
 * * Cloudfront alarms
 *
 * This is done in a different stack, because Route53-rules must be placed in us-east-1, and the
 * monitoring-stack is not placed there.
 *
 * TODO: Should we change the id?
 */
export class GlobalMonitoringStack extends Stack {
    constructor(
        scope: Construct,
        id: string,
        topic: Topic,
        configuration: MonitoringConfiguration
    ) {
        super(scope, `${id}Route53`, {
            env: {
                account: configuration.env.account,
                region: "us-east-1",
            },
        });

        if (configuration.cloudfront) {
            new CloudfrontMonitoring(this, topic, configuration.cloudfront);
        }

        if (configuration.route53) {
            new Route53Monitoring(this, topic, configuration.route53);
        }
    }
}
