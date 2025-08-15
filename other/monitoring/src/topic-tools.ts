import { EventField, RuleTargetInput } from "aws-cdk-lib/aws-events";

export const TOPICS = {
  account: EventField.account,
  region: EventField.region,
  principalId: EventField.fromPath("$.detail.userIdentity.principalId"),
  eventName: EventField.fromPath("$.detail.eventName"),
} as const;

export function createMessage(title: string, message: string): RuleTargetInput {
  return RuleTargetInput.fromMultilineText(
    `${title}
                     account: ${TOPICS.account}
                     region: ${TOPICS.region}
                     principalId: ${TOPICS.principalId}
                     ${message}
                    `,
  );
}
