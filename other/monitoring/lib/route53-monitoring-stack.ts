import { Stack } from "aws-cdk-lib";
import { Topic } from "aws-cdk-lib/aws-sns";
import { Construct } from "constructs";
import { MonitoringConfiguration } from "./app-props";
import { Route53Monitoring } from "./route53-monitoring";

export class Route53MonitoringStack extends Stack {
    constructor(
        scope: Construct,
        id: string,
        topic: Topic,
        configuration: MonitoringConfiguration
    ) {
        super(scope, id + "Route53", {
            env: {
                account: configuration.env.account,
                region: "us-east-1",
            },
        });

        if (configuration.route53) {
            new Route53Monitoring(this, topic);
        }
    }
}
