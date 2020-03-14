import {Stack, StackProps, Construct} from '@aws-cdk/core';
import {CloudFrontWebDistribution, OriginAccessIdentity} from '@aws-cdk/aws-cloudfront';
import {BlockPublicAccess, Bucket} from '@aws-cdk/aws-s3';
import {createOriginConfig} from "../../common/stack/origin-configs";
import {createAliasConfig} from "../../common/stack/alias-configs";
import {Props} from '../lib/app-props';

export class CloudfrontCdkStack extends Stack {
    constructor(scope: Construct, id: string, cloudfrontProps: Props[], props?: StackProps) {
        super(scope, id, props);

        cloudfrontProps.forEach(p => this.createDistribution(p));
    }

    createDistribution(cloudfrontProps: Props) {
        const env = cloudfrontProps.environmentName;
        const oai = cloudfrontProps.originAccessIdentity ? new OriginAccessIdentity(this, `${env}-oai`) : null;

        const originConfigs = cloudfrontProps.domains.map(d => createOriginConfig(this, d, oai));
        const bucket = new Bucket(this, `${env}-cf-logBucket`, {
            versioned: false,
            bucketName: `${env}-cf-cloudfront-logs`,
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