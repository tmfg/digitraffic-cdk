import {CloudFrontWebDistribution} from '@aws-cdk/aws-cloudfront';
import {Stack, CfnResource} from '@aws-cdk/core';
import {BlockPublicAccess, Bucket} from '@aws-cdk/aws-s3';
import {LambdaDestination} from '@aws-cdk/aws-s3-notifications';
import {Role} from '@aws-cdk/aws-iam';
import {CfnWebACL} from '@aws-cdk/aws-wafv2';

import {createAliasConfig} from "../../common/stack/alias-configs";
import {createWriteToEsLambda} from "./lambda/lambda-creator";
import {createWebAcl} from "./acl/acl-creator";
import {CFProps, Props} from '../lib/app-props';

function doCreateWebAcl(stack: Stack, props: Props): CfnWebACL | null {
    if(props.aclRules) {
        return createWebAcl(stack, props.environmentName, props.aclRules);
    }

    return null;
}

export function createDistribution(stack: Stack, distributionProps: Props, originConfigs: any[], role: Role, cloudfrontProps: CFProps, streamingConfig: any): CloudFrontWebDistribution {
    const webAcl = doCreateWebAcl(stack, distributionProps);
    const aliasConfig = distributionProps.acmCertRef == null ? undefined: createAliasConfig(distributionProps.acmCertRef as string, distributionProps.aliasNames as string[]);

    if (cloudfrontProps.elasticProps.streamingProps) {
        return createDistributionWithStreamingLogging(stack, distributionProps, originConfigs, aliasConfig, role, webAcl, streamingConfig);
    }

    return createDistributionWithS3Logging(stack, distributionProps, originConfigs, aliasConfig, role, cloudfrontProps, webAcl);
}

function createDistributionWithStreamingLogging(stack: Stack, distributionProps: Props, originConfigs: any[], aliasConfiguration: any, role: Role, webAcl: any, streamingConfig: any): CloudFrontWebDistribution {
    const env = distributionProps.environmentName;

    const distribution = new CloudFrontWebDistribution(stack, distributionProps.distributionName, {
        originConfigs,
        aliasConfiguration,
        webACLId: webAcl?.attrArn
    });

    addRealtimeLogging(stack, distribution, role, env, streamingConfig, originConfigs.length);

    return distribution;
}

function addRealtimeLogging(stack: Stack, distribution: CloudFrontWebDistribution, role:Role, env: String, streamingConfig: any, originCount: number) {
    const distributionCf = distribution.node.defaultChild as CfnResource;
    
    for (let i = 1; i < originCount;i++) {
        distributionCf.addPropertyOverride(`DistributionConfig.CacheBehaviors.${i - 1}.RealtimeLogConfigArn`, streamingConfig.loggingConfig.ref);
    }

    distributionCf.addPropertyOverride('DistributionConfig.DefaultCacheBehavior.RealtimeLogConfigArn', streamingConfig.loggingConfig.ref);
}

function createDistributionWithS3Logging(stack: Stack, distributionProps: Props, originConfigs: any[], aliasConfiguration: any, role: Role, cloudfrontProps: CFProps, webAcl: any): CloudFrontWebDistribution {
    const env = distributionProps.environmentName;

    const bucket = new Bucket(stack, `${env}-CF-logBucket`, {
        versioned: false,
        bucketName: `${env}-cf-logs`,
        publicReadAccess: false,
        blockPublicAccess: BlockPublicAccess.BLOCK_ALL
    });

    const lambda = createWriteToEsLambda(stack, env, role, cloudfrontProps.elasticProps.elasticDomain, cloudfrontProps.elasticAppName);

    bucket.addObjectCreatedNotification(new LambdaDestination(lambda));
    bucket.grantRead(lambda);

    return new CloudFrontWebDistribution(stack, distributionProps.distributionName, {
        originConfigs,
        aliasConfiguration,
        loggingConfig: {
            bucket: bucket,
            prefix: 'logs'
        },
        webACLId: webAcl?.attrArn
    });
}