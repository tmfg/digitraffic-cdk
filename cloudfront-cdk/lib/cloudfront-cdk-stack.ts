import {Stack, StackProps, Construct} from '@aws-cdk/core';
import {CloudFrontWebDistribution, OriginAccessIdentity} from '@aws-cdk/aws-cloudfront';
import {BlockPublicAccess, Bucket} from '@aws-cdk/aws-s3';
import {createOriginConfig} from "../../common/stack/origin-configs";
import {createAliasConfig} from "../../common/stack/alias-configs";
import {Props} from '../lib/app-props';
import {Runtime, Function, AssetCode, Version} from '@aws-cdk/aws-lambda';

export class CloudfrontCdkStack extends Stack {
    constructor(scope: Construct, cloudfrontProps: Props[], props?: StackProps) {
        super(scope, 'CloudfrontCdkStack', props);

        const lambdaMap = this.createLambdas();

        cloudfrontProps.forEach(p => this.createDistribution(p, lambdaMap));
    }

    createLambdas() {
        const lambdaMap:any = {};

        const redirectFunction = new Function(this, 'weathercam-redirect', {
            runtime: Runtime.NODEJS_12_X,
            memorySize: 128,
            code: new AssetCode('dist/lambda'),
            handler: 'lambda-redirect.handler',
        });

        lambdaMap['redirect'] = new Version(this, "RedirectVersion", {
            lambda: redirectFunction
        }).functionArn;

        return lambdaMap;
    }

    createDistribution(cloudfrontProps: Props, lambdaMap: any) {
        const env = cloudfrontProps.environmentName;
        const oai = cloudfrontProps.originAccessIdentity ? new OriginAccessIdentity(this, `${env}-oai`) : null;

        const originConfigs = cloudfrontProps.domains.map(d => createOriginConfig(this, d, oai, lambdaMap));
        const bucket = new Bucket(this, `${env}-CF-logBucket`, {
            versioned: false,
            bucketName: `${env}-cf-logs`,
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