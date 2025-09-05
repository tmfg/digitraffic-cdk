import type { SourceConfiguration } from "aws-cdk-lib/aws-cloudfront";
import {
  CloudFrontWebDistribution,
  GeoRestriction,
  HttpVersion,
  SecurityPolicyProtocol,
} from "aws-cdk-lib/aws-cloudfront";
import type { CfnResource, Stack } from "aws-cdk-lib";
import { Tags } from "aws-cdk-lib";
import type { CfnWebACL } from "aws-cdk-lib/aws-wafv2";
import type { ViewerCertificate } from "aws-cdk-lib/aws-cloudfront";

import { createWebAcl } from "./acl/acl-creator.js";
import type { CFProps, DistributionProps } from "./app-props.js";

export function createViewerCertificate(
  acmCertificateArn: string,
  aliases: string[],
): ViewerCertificate {
  return {
    props: {
      acmCertificateArn,
      sslSupportMethod: "sni-only",
      minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2021,
    },
    aliases,
  };
}

function doCreateWebAcl(
  stack: Stack,
  props: DistributionProps,
): CfnWebACL | undefined {
  if (props.aclRules) {
    return createWebAcl(
      stack,
      props.environmentName,
      props.aclRules,
      props.distributionName,
    );
  }

  return undefined;
}

export interface CreateDistributionProps {
  readonly distributionProps: DistributionProps;
  readonly originConfigs: SourceConfiguration[];
  readonly realtimeLogConfigArn: string;
  readonly bucketLogging?: CFProps["bucketLogging"];
}

export function createDistribution(
  stack: Stack,
  createDistributionProps: CreateDistributionProps,
): CloudFrontWebDistribution {
  const { distributionProps } = createDistributionProps;
  const webAcl = doCreateWebAcl(stack, distributionProps);
  const viewerCertificate = distributionProps.acmCertRef
    ? createViewerCertificate(
      distributionProps.acmCertRef,
      distributionProps.aliasNames,
    )
    : undefined;

  return createDistributionWithStreamingLogging(
    stack,
    createDistributionProps,
    viewerCertificate,
    webAcl,
  );
}

function createGeoRestriction(
  distributionProps: DistributionProps,
): GeoRestriction | undefined {
  return distributionProps.geoblock
    ? GeoRestriction.denylist(...distributionProps.geoblock)
    : undefined;
}

function createDistributionWithStreamingLogging(
  stack: Stack,
  createDistributionProps: CreateDistributionProps,
  viewerCertificate: ViewerCertificate | undefined,
  webAcl: CfnWebACL | undefined,
): CloudFrontWebDistribution {
  const { distributionProps, originConfigs } = createDistributionProps;
  const distribution = new CloudFrontWebDistribution(
    stack,
    distributionProps.distributionName,
    {
      originConfigs,
      viewerCertificate,
      webACLId: webAcl?.attrArn,
      httpVersion: HttpVersion.HTTP2_AND_3,
      defaultRootObject: "index.html",
      geoRestriction: createGeoRestriction(distributionProps),
    },
  );

  if (!distributionProps.disableShieldAdvanced) {
    Tags.of(distribution).add("EnableShieldAdvanced", "true");
  }

  addRealtimeLogging(distribution, createDistributionProps);

  return distribution;
}

function addRealtimeLogging(
  distribution: CloudFrontWebDistribution,
  createDistributionProps: CreateDistributionProps,
): void {
  const {
    originConfigs,
    realtimeLogConfigArn,
    distributionProps,
    bucketLogging,
  } = createDistributionProps;
  const distributionCf = distribution.node.defaultChild as CfnResource;

  const length = originConfigs.flatMap((o) => o.behaviors).length;

  for (let i = 1; i < length; i++) {
    distributionCf.addPropertyOverride(
      `DistributionConfig.CacheBehaviors.${i - 1}.RealtimeLogConfigArn`,
      realtimeLogConfigArn,
    );
  }

  distributionCf.addPropertyOverride(
    "DistributionConfig.DefaultCacheBehavior.RealtimeLogConfigArn",
    realtimeLogConfigArn,
  );

  if (bucketLogging) {
    const { bucket, prefix } = bucketLogging;
    const alias = distributionProps.aliasNames[0] ?? "default";

    distributionCf.addPropertyOverride(
      "DistributionConfig.Logging.Bucket",
      bucket,
    );
    distributionCf.addPropertyOverride(
      "DistributionConfig.Logging.Prefix",
      `${prefix}/${alias}`,
    );
  }
}
