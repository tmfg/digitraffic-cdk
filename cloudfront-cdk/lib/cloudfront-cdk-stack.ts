import {Stack, StackProps, Construct} from '@aws-cdk/core';
import {CloudFrontWebDistribution} from '@aws-cdk/aws-cloudfront';
import {BlockPublicAccess, Bucket} from '@aws-cdk/aws-s3';
import {createOriginConfig} from "../../common/stack/origin-configs";
import {createAliasConfig} from "../../common/stack/alias-configs";
import {Props} from '../lib/app-props';

export class CloudfrontCdkStack extends Stack {
    constructor(scope: Construct, id: string, cloudfrontProps: Props, props?: StackProps) {
        super(scope, id, props);

        this.createDistribution(cloudfrontProps);
    }

    createDistribution(cloudfrontProps: Props) {
        const originConfigs = cloudfrontProps.domains.map(d => createOriginConfig(d));
        const bucket = new Bucket(this, 'logBucket', {
            versioned: false,
            bucketName: `${cloudfrontProps.environmentName}-cloudfront-logs`,
            publicReadAccess: false,
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL
        });

        const aliasConfig = cloudfrontProps.acmCertRef == null ? undefined: createAliasConfig(cloudfrontProps.acmCertRef as string, cloudfrontProps.aliasNames as string[]);

        return new CloudFrontWebDistribution(this, cloudfrontProps.distributionName, {
            originConfigs: originConfigs,
            aliasConfiguration: aliasConfig,
            loggingConfig: {
                bucket: bucket,
                prefix: 'logs'
            },
//            webACLId: 'per-ip-rate-acl'
        });
    }
}