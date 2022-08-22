import {
    CloudFrontWebDistribution,
    HttpVersion,
    SecurityPolicyProtocol,
    SourceConfiguration,
} from 'aws-cdk-lib/aws-cloudfront';
import {CfnResource, Stack, Tags} from 'aws-cdk-lib';
import {Role} from 'aws-cdk-lib/aws-iam';
import {CfnWebACL} from 'aws-cdk-lib/aws-wafv2';
import {ViewerCertificate} from "aws-cdk-lib/aws-cloudfront/lib/web-distribution";

import {createWebAcl} from "./acl/acl-creator";
import {CFProps, DistributionProps} from './app-props';
import {StreamingConfig} from "./streaming-util";

export function createViewerCertificate(acmCertificateArn: string, aliases: string[]): ViewerCertificate {
    return {
        props: {
            acmCertificateArn,
            sslSupportMethod: 'sni-only',
            minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2021,
        },
        aliases,
    };
}


function doCreateWebAcl(stack: Stack, props: DistributionProps): CfnWebACL | null {
    if (props.aclRules) {
        return createWebAcl(stack, props.environmentName, props.aclRules);
    }

    return null;
}

export function createDistribution(
    stack: Stack,
    distributionProps: DistributionProps,
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
    distributionProps: DistributionProps,
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
        httpVersion: HttpVersion.HTTP2_AND_3,
    });

    if (!distributionProps?.disableShieldAdvanced === true) {
        Tags.of(distribution).add('EnableShieldAdvanced', 'true');
    }

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
