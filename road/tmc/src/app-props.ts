import type { StackConfiguration } from "@digitraffic/common/dist/aws/infra/stack/stack";

export interface TmcProps extends StackConfiguration {
  /** Existing bucket name (`tmc-road-<env>`); this stack imports it, it never creates it. */
  readonly bucketName: string;
  /** Distribution that serves tie(-test).digitraffic.fi/tmc/*; granted read access. */
  readonly cloudfrontDistributionArn: string;
}
