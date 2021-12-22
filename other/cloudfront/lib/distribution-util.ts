import {CloudFrontWebDistribution, SourceConfiguration} from 'aws-cdk-lib/aws-cloudfront';
import {CfnResource, Stack} from 'aws-cdk-lib';
import {Role} from 'aws-cdk-lib/aws-iam';
import {CfnWebACL} from 'aws-cdk-lib/aws-wafv2';
import {ViewerCertificate} from "aws-cdk-lib/aws-cloudfront/lib/web-distribution";

import {createViewerCertificate} from "digitraffic-common/stack/alias-configs";
import {createWebAcl} from "./acl/acl-creator";
import {CFProps, Props} from './app-props';
import {StreamingConfig} from "./streaming-util";

function doCreateWebAcl(stack: Stack, props: Props): CfnWebACL | null {
    if (props.aclRules) {
        return createWebAcl(stack, props.environmentName, props.aclRules);
    }

    return null;
}

export function createDistribution(
    stack: Stack,
    distributionProps: Props,
    originConfigs: SourceConfiguration[],
    role: Role,
    cloudfrontProps: CFProps,
    streamingConfig: StreamingConfig,
): CloudFrontWebDistribution {
    const webAcl = doCreateWebAcl(stack, distributionProps);
    const viewerCertificate = distributionProps.acmCertRef == null ? undefined: createViewerCertificate(distributionProps.acmCertRef as string, distributionProps.aliasNames as string[]);

    return createDistributionWithStreamingLogging(
        stack, distributionProps, originConfigs, viewerCertificate, role, webAcl, streamingConfig,
    );
}

function createDistributionWithStreamingLogging(
    stack: Stack,
    distributionProps: Props,
    originConfigs: SourceConfiguration[],
    viewerCertificate: ViewerCertificate | undefined,
    role: Role,
    webAcl: CfnWebACL | null,
    streamingConfig: StreamingConfig,
): CloudFrontWebDistribution {
    const env = distributionProps.environmentName;

    const distribution = new CloudFrontWebDistribution(stack, distributionProps.distributionName, {
        originConfigs,
        viewerCertificate,
        webACLId: webAcl?.attrArn,
    });

    addRealtimeLogging(
        stack, distribution, role, env, streamingConfig, originConfigs.length,
    );

    return distribution;
}

function addRealtimeLogging(
    stack: Stack, distribution: CloudFrontWebDistribution, role:Role, env: string, streamingConfig: StreamingConfig, originCount: number,
) {
    const distributionCf = distribution.node.defaultChild as CfnResource;

    for (let i = 1; i < originCount;i++) {
        distributionCf.addPropertyOverride(`DistributionConfig.CacheBehaviors.${i - 1}.RealtimeLogConfigArn`, streamingConfig.loggingConfig.ref);
    }

    distributionCf.addPropertyOverride('DistributionConfig.DefaultCacheBehavior.RealtimeLogConfigArn', streamingConfig.loggingConfig.ref);
}
