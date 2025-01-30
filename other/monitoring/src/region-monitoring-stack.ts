import { Stack } from "aws-cdk-lib";
import type { Topic } from "aws-cdk-lib/aws-sns";
import type { Construct } from "constructs";
import type { MonitoringConfiguration } from "./app-props.js";
import { CloudfrontMonitoring } from "./cloudfront-monitoring.js";
import { Route53Monitoring } from "./route53-monitoring.js";

/**
 * Creates a new stack for all monitoring that must be placed in global region(us-east-1):
 * * Route53 changes for given zones
 * * Cloudfront alarms
 *
 * This is done in a different stack, because the MonitoringStack in is not in the global region.
 *
 * TODO: Should we change the id?
 */
export class RegionMonitoringStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    topic: Topic,
    configuration: MonitoringConfiguration,
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
