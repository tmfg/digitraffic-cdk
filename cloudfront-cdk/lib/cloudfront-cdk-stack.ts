import {Stack, StackProps, Construct} from '@aws-cdk/core';
import {CloudFrontWebDistribution, OriginAccessIdentity} from '@aws-cdk/aws-cloudfront';
import {BlockPublicAccess, Bucket} from '@aws-cdk/aws-s3';
import {createOriginConfig} from "../../common/stack/origin-configs";
import {createAliasConfig} from "../../common/stack/alias-configs";
import {CFLambdaProps, CFProps, Props} from '../lib/app-props';
import {createWeathercamRedirect, LambdaType} from "./lambda/lambda-creator";

export class CloudfrontCdkStack extends Stack {
    constructor(scope: Construct, id: string, cloudfrontProps: CFProps, props?: StackProps) {
        super(scope, id, props);

        const lambdaMap = this.createLambdaMap(cloudfrontProps.lambdaProps);

        cloudfrontProps.props.forEach(p => this.createDistribution(p, lambdaMap));
    }

    createLambdaMap(lProps: CFLambdaProps | undefined): any {
        let lambdaMap: any = {};

        if(lProps != undefined) {
//            console.info("got props " + JSON.stringify(lProps));

            if(lProps.lambdaTypes.includes(LambdaType.WEATHERCAM_REDIRECT)) {
                lambdaMap[LambdaType.WEATHERCAM_REDIRECT] =
                    createWeathercamRedirect(this, lProps.lambdaParameters.weathercamDomainName, lProps.lambdaParameters.weathercamHostName);
            }
        }

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