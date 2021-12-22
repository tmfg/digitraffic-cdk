import {CloudFrontWebDistribution, SourceConfiguration} from 'aws-cdk-lib/aws-cloudfront';
import {Stack, CfnResource} from 'aws-cdk-lib';
import {BlockPublicAccess, Bucket} from 'aws-cdk-lib/aws-s3';
import {LambdaDestination} from 'aws-cdk-lib/aws-s3-notifications';
import {Role} from 'aws-cdk-lib/aws-iam';
import {CfnWebACL} from 'aws-cdk-lib/aws-wafv2';
import {ViewerCertificate} from "aws-cdk-lib/aws-cloudfront/lib/web-distribution";

import {createViewerCertificate} from "digitraffic-common/stack/alias-configs";
import {createWriteToEsLambda} from "./lambda/lambda-creator";
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

    if (cloudfrontProps.elasticProps.streamingProps) {
        return createDistributionWithStreamingLogging(
            stack, distributionProps, originConfigs, viewerCertificate, role, webAcl, streamingConfig,
        );
    }

    return createDistributionWithS3Logging(
        stack, distributionProps, originConfigs, viewerCertificate, role, cloudfrontProps, webAcl,
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

function createDistributionWithS3Logging(
    stack: Stack,
    distributionProps: Props,
    originConfigs: SourceConfiguration[],
    viewerCertificate: ViewerCertificate | undefined,
    role: Role,
    cloudfrontProps: CFProps,
    webAcl: CfnWebACL | null,
): CloudFrontWebDistribution {
    const env = distributionProps.environmentName;

    const bucket = new Bucket(stack, `${env}-CF-logBucket`, {
        versioned: false,
        bucketName: `${env}-cf-logs`,
        publicReadAccess: false,
        blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    });

    const lambda = createWriteToEsLambda(
        stack, env, role, cloudfrontProps.elasticProps.elasticDomain, cloudfrontProps.elasticAppName,
    );

    bucket.addObjectCreatedNotification(new LambdaDestination(lambda));
    bucket.grantRead(lambda);

    return new CloudFrontWebDistribution(stack, distributionProps.distributionName, {
        originConfigs,
        viewerCertificate,
        loggingConfig: {
            bucket: bucket,
            prefix: 'logs',
        },
        webACLId: webAcl?.attrArn,
    });
}
