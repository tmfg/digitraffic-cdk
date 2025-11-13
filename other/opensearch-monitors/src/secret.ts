import type { GenericSecret } from "@digitraffic/common/dist/aws/runtime/secrets/secret";
export interface StatusSecret extends GenericSecret {
  readonly reportUrl: string;
  readonly slackAlarmHook: string;
}
