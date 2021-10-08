import {Construct} from "@aws-cdk/core";
import {Rule} from "@aws-cdk/aws-events";
import {ITopic} from "@aws-cdk/aws-sns";
import {SnsTopic} from "@aws-cdk/aws-events-targets";

export class DigitrafficSecurityRule extends Rule {
    constructor(scope: Construct, topic: ITopic) {
        const ruleName = 'SecurityHubRule';
        super(scope, ruleName, {
            ruleName,
            eventPattern: {
                source: ['aws.securityhub'],
                detailType: ["Security Hub Findings - Imported"],
                detail: {
                    findings: {
                        "Workflow": {
                            "Status": ["NEW"]
                        },
                        "Severity": {
                            "Label": ["HIGH", "CRITICAL"]
                        }
                    }
                }
           }
        });

        this.addTarget(new SnsTopic(topic));
    }
}