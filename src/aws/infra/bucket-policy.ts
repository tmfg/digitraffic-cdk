import {
  CanonicalUserPrincipal,
  Effect,
  PolicyStatement,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import type { Bucket } from "aws-cdk-lib/aws-s3";

export interface BaseGrantConfiguration {
  readonly bucket: Bucket;

  /**
   * Specify resources
   *
   * @default bucketArn + "/*"
   */
  readonly resources?: string[];

  /**
   * Specify granted actions
   *
   * @default ["s3:GetObject"]
   */
  readonly actions?: string[];

  /**
   * Allow or deny
   *
   * @default Effect.ALLOW
   */
  readonly effect?: Effect;
}

export interface CloudfrontGrantConfiguration extends BaseGrantConfiguration {
  readonly distributionArn: string;
}

export interface CloudfrontOAIGrantConfiguration
  extends BaseGrantConfiguration {
  readonly canonicalUserId: string;
}

/**
 * Grant given cloudfront distribution rights to given bucket
 */
export function grantOACRights(config: CloudfrontGrantConfiguration): void {
  config.bucket.addToResourcePolicy(
    new PolicyStatement({
      effect: config.effect ?? Effect.ALLOW,
      principals: [new ServicePrincipal("cloudfront.amazonaws.com")],
      resources: config.resources ?? [config.bucket.bucketArn + "/*"],
      actions: config.actions ?? ["s3:GetObject"],
      conditions: {
        "StringEquals": {
          "AWS:SourceArn": config.distributionArn,
        },
      },
    }),
  );
}

/**
 * Grant given distribution OAI rights to given bucket.
 * @deprecated use OAC and grantCloudfrontRights
 */
export function grantOAIRights(config: CloudfrontOAIGrantConfiguration): void {
  config.bucket.addToResourcePolicy(
    new PolicyStatement({
      effect: config.effect ?? Effect.ALLOW,
      principals: [new CanonicalUserPrincipal(config.canonicalUserId)],
      resources: config.resources ?? [config.bucket.bucketArn + "/*"],
      actions: config.actions ?? ["s3:GetObject"],
    }),
  );
}
