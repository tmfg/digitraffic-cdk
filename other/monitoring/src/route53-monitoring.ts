import type { Stack } from "aws-cdk-lib";
import { Rule } from "aws-cdk-lib/aws-events";
import { SnsTopic } from "aws-cdk-lib/aws-events-targets";
import type { Topic } from "aws-cdk-lib/aws-sns";
import type { Route53Configuration } from "./app-props.js";

export class Route53Monitoring {
    constructor(stack: Stack, alarmsTopic: Topic, config: Route53Configuration) {
        // eslint-disable-next-line no-new
        new Rule(stack, "Route53Rule", {
            eventPattern: {
                source: ["aws.route53"],
                detail: {
                    requestParameters: {
                        hostedZoneId: config.zoneIds
                    }
                }
            },
            targets: [new SnsTopic(alarmsTopic)]
        });
    }
}
