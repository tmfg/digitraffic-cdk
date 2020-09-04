import {Construct, Stack, StackProps} from '@aws-cdk/core';
import {CfnDistribution, CloudFrontWebDistribution, OriginAccessIdentity} from '@aws-cdk/aws-cloudfront';
import {BlockPublicAccess, Bucket} from '@aws-cdk/aws-s3';
import {LambdaDestination} from '@aws-cdk/aws-s3-notifications';
import {CfnWebACL} from '@aws-cdk/aws-wafv2';
import {CompositePrincipal, ManagedPolicy, PolicyStatement, Role, ServicePrincipal} from '@aws-cdk/aws-iam';
import {createOriginConfig} from "./origin-configs";
import {createAliasConfig} from "../../common/stack/alias-configs";
import {CFDomain, CFLambdaProps, CFProps, ElasticProps, Props} from '../lib/app-props';
import {
    createGzipRequirement,
    createHttpHeaders, createIpRestriction,
    createWeathercamRedirect,
    createWriteToEsLambda,
    LambdaType
} from "./lambda/lambda-creator";
import {createWebAcl} from "./acl/acl-creator";

export class CloudfrontCdkStack extends Stack {
    constructor(scope: Construct, id: string, cloudfrontProps: CFProps, props?: StackProps) {
        super(scope, id, props);

        const lambdaMap = this.createLambdaMap(cloudfrontProps.lambdaProps);
        const writeToESROle = this.createWriteToESRole(this, cloudfrontProps.elasticProps);

        cloudfrontProps.props.forEach(p => this.createDistribution(p, writeToESROle, lambdaMap, cloudfrontProps.elasticProps.elasticDomain, cloudfrontProps.elasticAppName));
    }

    createWriteToESRole(stack: Construct, elasticProps: ElasticProps) {
        const lambdaRole = new Role(stack, `S3LambdaToElasticRole`, {
            assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
            roleName: `S3LambdaToElasticRole`
        });
        lambdaRole.addToPolicy(new PolicyStatement({
            actions: [
                "es:DescribeElasticsearchDomain",
                "es:DescribeElasticsearchDomains",
                "es:DescribeElasticsearchDomainConfig",
                "es:ESHttpPost",
                "es:ESHttpPut",
                "es:ESHttpGet"
            ],
            resources: [
                elasticProps.elasticArn,
                `${elasticProps.elasticArn}/*`
            ]
        }));
        lambdaRole.addToPolicy(new PolicyStatement( {
            actions: [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
                "logs:DescribeLogGroups",
                "logs:DescribeLogStreams"
            ],
            resources: [
                "arn:aws:logs:*:*:*"
            ]
        }));

        return lambdaRole;
    }

    createLambdaMap(lProps: CFLambdaProps | undefined): any {
        let lambdaMap: any = {};

        if(lProps != undefined) {
            const edgeLambdaRole = new Role(this, 'edgeLambdaRole', {
                assumedBy:  new CompositePrincipal(
                    new ServicePrincipal("lambda.amazonaws.com"),
                    new ServicePrincipal("edgelambda.amazonaws.com"),
                ),
                managedPolicies: [
                    ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
                ]
            });

            if(lProps.lambdaTypes.includes(LambdaType.WEATHERCAM_REDIRECT)) {
                lambdaMap[LambdaType.WEATHERCAM_REDIRECT] =
                    createWeathercamRedirect(this, edgeLambdaRole, lProps.lambdaParameters.weathercamDomainName, lProps.lambdaParameters.weathercamHostName);
            }

            if(lProps.lambdaTypes.includes(LambdaType.GZIP_REQUIREMENT)) {
                lambdaMap[LambdaType.GZIP_REQUIREMENT] =
                    createGzipRequirement(this, edgeLambdaRole);
            }

            if(lProps.lambdaTypes.includes(LambdaType.HTTP_HEADERS)) {
                lambdaMap[LambdaType.HTTP_HEADERS] =
                    createHttpHeaders(this, edgeLambdaRole);
            }

            if(lProps.lambdaTypes.includes(LambdaType.IP_RESTRICTION)) {
                lambdaMap[LambdaType.IP_RESTRICTION] =
                    createIpRestriction(this, edgeLambdaRole, lProps.lambdaParameters.vsAllowedIpAddresses);
            }
        }

        return lambdaMap;
    }

    createWebAcl(props: Props): CfnWebACL | null {
        if(props.aclRules) {
            return createWebAcl(this, props.environmentName, props.aclRules);
        }

        return null;
    }

    createDistribution(cloudfrontProps: Props, role: Role, lambdaMap: any, elasticDomain: string, elasticAppName: string) {
        const env = cloudfrontProps.environmentName;
        const oai = cloudfrontProps.originAccessIdentity ? new OriginAccessIdentity(this, `${env}-oai`) : null;

        const originConfigs = cloudfrontProps.domains.map(d => createOriginConfig(this, d, oai, lambdaMap));
        const bucket = new Bucket(this, `${env}-CF-logBucket`, {
            versioned: false,
            bucketName: `${env}-cf-logs`,
            publicReadAccess: false,
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL
        });

        const lambda = createWriteToEsLambda(this, env, role, elasticDomain, elasticAppName);

        bucket.addObjectCreatedNotification(new LambdaDestination(lambda));
        bucket.grantRead(lambda);

        const aliasConfig = cloudfrontProps.acmCertRef == null ? undefined: createAliasConfig(cloudfrontProps.acmCertRef as string, cloudfrontProps.aliasNames as string[]);
        const webAcl = this.createWebAcl(cloudfrontProps);
        const distribution = new CloudFrontWebDistribution(this, cloudfrontProps.distributionName, {
            originConfigs: originConfigs,
            aliasConfiguration: aliasConfig,
            loggingConfig: {
                bucket: bucket,
                prefix: 'logs'
            },
            webACLId: webAcl?.attrArn
        });

        // cdk does not support viewerPolicy as it should
        // so collect map of policies and force them into cloudformation
        const viewerPolicies = this.getViewerPolicies(cloudfrontProps.domains);

//        console.info('viewer policies %s for distribution %s', JSON.stringify(viewerPolicies), cloudfrontProps.distributionName);

        if(Object.keys(viewerPolicies).length > 0) {
            const cfnDistribution = distribution.node.defaultChild as CfnDistribution;
            const distributionConfig = cfnDistribution.distributionConfig as CfnDistribution.DistributionConfigProperty;
            const behaviors = distributionConfig?.cacheBehaviors as CfnDistribution.CacheBehaviorProperty[];

            // handle all behaviors
            behaviors?.forEach((cb: CfnDistribution.CacheBehaviorProperty) => {
                this.setViewerPolicy(cb, viewerPolicies, cb.pathPattern);
            });

            // and the default behavior
            this.setViewerPolicy(distributionConfig.defaultCacheBehavior, viewerPolicies, '*');
        }

        return distribution;
    }

    setViewerPolicy(behavior: any, viewerPolicies: any, pathPattern: string) {
        const policy = viewerPolicies[pathPattern];

        if(policy) {
//            console.info('setting viewer policy %s for %s', policy, pathPattern);

            (behavior as any).viewerProtocolPolicy = policy;
        }
    }

    getViewerPolicies(domains: CFDomain[]) {
        const policyMap: any = {};

        domains.forEach(d => {
            d.behaviors?.forEach(b => {
                if(b.viewerProtocolPolicy != null) {
                    policyMap[b.path] = b.viewerProtocolPolicy;
                }
            })
        });

        return policyMap;
    }
}