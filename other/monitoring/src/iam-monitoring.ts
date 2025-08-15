import { type Stack } from "aws-cdk-lib";
import { type Topic } from "aws-cdk-lib/aws-sns";
import { EventField, Match, Rule } from "aws-cdk-lib/aws-events";
import { SnsTopic } from "aws-cdk-lib/aws-events-targets";
import { createMessage, TOPICS } from "./topic-tools.js";

export class IamMonitoring {
  constructor(
    stack: Stack,
    alarmsTopic: Topic,
  ) {
    // eslint-disable-next-line no-new
    new Rule(stack, "IamRule", {
      eventPattern: {
        source: ["aws.iam"],
        detail: {
          eventName: Match.anyOf(
            "CreateUser",
            "UpdateUser",
            "DeleteUser",
            "CreateRole",
            "UpdateRole",
            "DeleteRole",
          ),
        },
      },
      targets: [
        new SnsTopic(alarmsTopic, {
          message: createMessage(
            "RUNBOOK Y6 - IAM Changes",
            `eventName: ${TOPICS.eventName}
                     roleName: ${
              EventField.fromPath("$.detail.requestParameters.roleName")
            }
                    `,
          ),
        }),
      ],
    });
  }
}
