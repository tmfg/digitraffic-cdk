import { Stack } from "aws-cdk-lib";
import { Rule } from "aws-cdk-lib/aws-events";
import { SnsTopic } from "aws-cdk-lib/aws-events-targets";
import { Topic } from "aws-cdk-lib/aws-sns";
import { Route53Configuration } from "./app-props";

export class Route53Monitoring {
    private readonly stack: Stack;
    private readonly alarmsTopic: Topic;

    constructor(
        stack: Stack,
        alarmsTopic: Topic,
        config: Route53Configuration
    ) {
        this.stack = stack;
        this.alarmsTopic = alarmsTopic;

        new Rule(stack, "Route53Rule", {
            eventPattern: {
                source: ["aws.route53"],
                detail: {
                    requestParameters: {
                        hostedZoneId: config.routeIds,
                    },
                },
            },
            targets: [new SnsTopic(alarmsTopic)],
        });
    }
}