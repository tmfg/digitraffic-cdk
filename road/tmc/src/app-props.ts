import type { StackConfiguration } from "@digitraffic/common/dist/aws/infra/stack/stack";

export interface TmcProps extends StackConfiguration {
  /** Existing bucket name (`tmc-road-<env>`); this stack imports it, it never creates it. */
  readonly bucketName: string;
  /** Distribution that serves tie(-test).digitraffic.fi/tmc/*; granted read access. */
  readonly cloudfrontDistributionArn: string;
  /**
   * Set to true only after the CloudFormation `TmcS3BucketPolicy` for this environment has
   * been removed from `digitraffic-cloudformation.yml`. Before that, CloudFormation still
   * owns the real bucket policy; this stack must not also try to manage it, or the two
   * would fight each other's updates.
   *
   * @default false
   */
  readonly applyBucketPolicy?: boolean;
}
