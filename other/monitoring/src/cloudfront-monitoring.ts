import { CfnAlarm } from "aws-cdk-lib/aws-cloudwatch";
import { Rule, RuleTargetInput } from "aws-cdk-lib/aws-events";
import { SnsTopic } from "aws-cdk-lib/aws-events-targets";
import type { Topic } from "aws-cdk-lib/aws-sns";
import type { CloudfrontConfiguration } from "./app-props.js";
import type { Stack } from "aws-cdk-lib";

export class CloudfrontMonitoring {
    constructor(stack: Stack, alarmsTopic: Topic, config: CloudfrontConfiguration) {
        config.distributions.forEach((distribution) => {
            const metricId = `bm_${distribution.id}`;
            const detectorId = `detector_${distribution.id}`;

            const alarmName = `${distribution.id}-bytes-downloaded`;

            // eslint-disable-next-line no-new
            new CfnAlarm(stack, `${distribution.id}-BytesDownloadedAlarm`, {
                alarmName,
                comparisonOperator: "LessThanLowerOrGreaterThanUpperThreshold",
                datapointsToAlarm: 1,
                evaluationPeriods: 1,
                metrics: [
                    {
                        id: metricId,
                        metricStat: {
                            metric: {
                                metricName: "BytesDownloaded",
                                namespace: "AWS/CloudFront",
                                dimensions: [
                                    {
                                        name: "DistributionId",
                                        value: distribution.id
                                    },
                                    {
                                        name: "Region",
                                        value: "Global"
                                    }
                                ]
                            },
                            period: 60 * 60,
                            stat: "Average"
                        }
                    },
                    {
                        expression: `ANOMALY_DETECTION_BAND(${metricId}, ${distribution.threshold ?? 2})`,
                        id: detectorId
                    }
                ],
                thresholdMetricId: detectorId
            });

            // our topic is in another region, so can't put it as alarmAction in CfnAlarm.
            // so we create a rule that listens to this alarm state changes and sends notification to our topic
            // eslint-disable-next-line no-new
            new Rule(stack, "Cloudfront-bytes-rule-" + distribution.id, {
                eventPattern: {
                    source: ["aws.cloudwatch"],
                    detail: {
                        alarmName: [alarmName]
                    }
                },
                targets: [
                    new SnsTopic(alarmsTopic, {
                        message: RuleTargetInput.fromText(
                            `CloudFront ${distribution.name} downloaded bytes not in band!`
                        )
                    })
                ]
            });
        });
    }
}
