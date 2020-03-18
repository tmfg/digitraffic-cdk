import {Stack, StackProps, Construct} from '@aws-cdk/core';
import {CloudFrontWebDistribution, OriginAccessIdentity} from '@aws-cdk/aws-cloudfront';
import {BlockPublicAccess, Bucket} from '@aws-cdk/aws-s3';
import {createOriginConfig} from "../../common/stack/origin-configs";
import {createAliasConfig} from "../../common/stack/alias-configs";
import {CFProps, Props} from '../lib/app-props';
import {Runtime, Function, InlineCode} from '@aws-cdk/aws-lambda';
import {Role, ServicePrincipal, CompositePrincipal, ManagedPolicy} from '@aws-cdk/aws-iam';

const fs = require('fs');

export class CloudfrontCdkStack extends Stack {
    constructor(scope: Construct, cloudfrontProps: CFProps, props?: StackProps) {
        super(scope, 'CloudfrontCdkStack', props);

        const lambdaMap = this.createLambdaMap(cloudfrontProps);

        cloudfrontProps.props.forEach(p => this.createDistribution(p, lambdaMap));
    }

    createLambdaMap(cloudfrontProps: CFProps) {
        if(cloudfrontProps.weathercamDomainName && cloudfrontProps.weathercamHostName) {
            return this.createLambdas(cloudfrontProps.weathercamDomainName as string, cloudfrontProps.weathercamHostName as string);
        }

        return {}
    }

    createLambdas(domainName: string, hostName: string) {
        const lambdaMap:any = {};
        const versionString = new Date().toISOString();
        const lambdaBody = fs.readFileSync('dist/lambda/lambda-redirect.js');
        const functionBody = lambdaBody.toString()
            .replace(/EXT_HOST_NAME/gi, hostName)
            .replace(/EXT_DOMAIN_NAME/gi, domainName)
            .replace(/EXT_VERSION/gi, versionString);

        const redirectFunction = new Function(this, 'weathercam-redirect', {
            runtime: Runtime.NODEJS_12_X,
            memorySize: 128,
            code: new InlineCode(functionBody),
            handler: 'index.handler',
            role: new Role(this, 'edgeLambdaRole', {
                assumedBy:  new CompositePrincipal(
                    new ServicePrincipal("lambda.amazonaws.com"),
                    new ServicePrincipal("edgelambda.amazonaws.com"),
                ),
                managedPolicies: [
                    ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
                ]
            }),
        });

        const version = redirectFunction.addVersion(versionString);

        lambdaMap['redirect'] = version;

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