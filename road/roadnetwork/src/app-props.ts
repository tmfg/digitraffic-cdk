import type { StackConfiguration } from "@digitraffic/common/dist/aws/infra/stack/stack";

export interface RoadnetworkProps extends StackConfiguration {
  readonly bucketName: string;
  /** Distribution that serves tie(-test).digitraffic.fi; granted read access to the bucket. */
  readonly cloudfrontDistributionArn: string;
  /** IAM Identity Center permission set name used by the Road Network team SSO role. */
  readonly ssoPermissionSetName: string;
  /**
   * AWS account of the Road Network team. Write access is granted to
   * AWSReservedSSO_{permissionSetName}_* roles in this account, where
   * `permissionSetName` is configured via `ssoPermissionSetName`.
   */
  readonly roadnetworkAccountId: string;
}
