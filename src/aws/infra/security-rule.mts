import {Construct} from "constructs";
import {Rule} from "aws-cdk-lib/aws-events";
import type {ITopic} from "aws-cdk-lib/aws-sns";
import {SnsTopic} from "aws-cdk-lib/aws-events-targets";

/**
 * Automatic rule for Security Hub.  Send notification to given topic if the following conditions apply:
 * * There is a finding with a status of NEW
 * * It has severity of HIGH or CRITICAL
 * * It is in a FAILED state
 */
export class DigitrafficSecurityRule extends Rule {
    constructor(scope: Construct, topic: ITopic) {
        const ruleName = "SecurityHubRule";
        super(scope, ruleName, {
            ruleName,
            eventPattern: {
                source: ["aws.securityhub"],
                detailType: ["Security Hub Findings - Imported"],
                detail: {
                    findings: {
                        "Compliance": {
                            "Status": ["FAILED"],
                        },
                        "Workflow": {
                            "Status": ["NEW"],
                        },
                        "Severity": {
                            "Label": ["HIGH", "CRITICAL"],
                        },
                    },
                },
            },
        });

        this.addTarget(new SnsTopic(topic));
    }
}
