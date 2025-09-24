import { type Stack } from "aws-cdk-lib";
import { type Topic } from "aws-cdk-lib/aws-sns";
import { EventField, Rule } from "aws-cdk-lib/aws-events";
import { SnsTopic } from "aws-cdk-lib/aws-events-targets";
import { createMessage, TOPICS } from "./topic-tools.js";

export class KmsMonitoring {
  constructor(
    stack: Stack,
    alarmsTopic: Topic,
  ) {
    const KMS_SOURCE = "aws.kms";
    // eslint-disable-next-line no-new
    new Rule(stack, "KMSDeletionPendingRule", {
      ruleName: "kms-deletion-pending",
      description: "Alarm rule for KMS key deletion pending",
      eventPattern: {
        source: [KMS_SOURCE],
        detail: {
          eventName: [
            "ScheduleKeyDeletion",
          ],
        },
      },
      targets: [
        new SnsTopic(alarmsTopic, {
          message: createMessage(
            "RUNBOOK-Y8 KMS Deletion Pending",
            `eventName: ${TOPICS.eventName}
                     KeyId: ${
              EventField.fromPath("$.detail.requestParameters.keyId")
            }`,
          ),
        }),
      ],
    });
    // eslint-disable-next-line no-new
    new Rule(stack, "KMSChangesRule", {
      ruleName: "kms-changes",
      description: "Alarm rule for KMS key changes",
      eventPattern: {
        source: [KMS_SOURCE],
        detail: {
          eventName: [
            "DeleteAlias",
            "UpdateAlias",
            "DisableKey",
            "PutKeyPolicy",
          ],
        },
      },
      targets: [
        new SnsTopic(alarmsTopic, {
          message: createMessage(
            "RUNBOOK-Y9 KMS Changes",
            `eventName: ${TOPICS.eventName}
                     KeyId: ${
              EventField.fromPath("$.detail.requestParameters.keyId")
            }`,
          ),
        }),
      ],
    });
  }
}
