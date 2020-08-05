import {Construct, Stack, StackProps} from '@aws-cdk/core';
import {CloudFrontWebDistribution, OriginAccessIdentity} from '@aws-cdk/aws-cloudfront';
import {BlockPublicAccess, Bucket} from '@aws-cdk/aws-s3';
import {CfnDeliveryStream } from "@aws-cdk/aws-kinesisfirehose";
import {LambdaDestination} from '@aws-cdk/aws-s3-notifications';
import {PolicyStatement, Role, ServicePrincipal, CompositePrincipal, ManagedPolicy} from '@aws-cdk/aws-iam';
import {createOriginConfig} from "../../common/stack/origin-configs";
import {createAliasConfig} from "../../common/stack/alias-configs";
import {CFLambdaProps, CFProps, ElasticProps, Props} from '../lib/app-props';
import {
    createGzipRequirement,
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

//        const firehose = this.createKinesisFirehose(cloudfrontProps.elasticProps, writeToESROle);
//        firehose.node.addDependency(writeToESROle);
    }

    createKinesisFirehose(elasticProps: ElasticProps, writeToESRole: Role): CfnDeliveryStream {
        return new CfnDeliveryStream(this, 'cloudfront-to-elastic-stream', {
            deliveryStreamName: 'cloudfront-to-elastic-stream',
            elasticsearchDestinationConfiguration: {
                domainArn: elasticProps.elasticArn,
                bufferingHints:  {
                    intervalInSeconds:120,
                    sizeInMBs: 5
                },
                indexName: 'road-test-cf',
                indexRotationPeriod: 'OneMonth',
                retryOptions: {
                    durationInSeconds: 300
                },
                s3BackupMode: 'FailedDocumentsOnly',
                typeName: 'TypeName',
                s3Configuration: {
                    bufferingHints:  {
                        intervalInSeconds:120,
                        sizeInMBs: 5
                    },
                    compressionFormat: 'GZIP',
                    bucketArn: 'arn:aws:s3:::weathercam-test-digitraffic-cf-logs',
                    roleArn: writeToESRole.roleArn
                },
                roleArn: writeToESRole.roleArn
            }
        });
    }

    createWriteToESRole(stack: Construct, elasticProps: ElasticProps) {
        const lambdaRole = new Role(stack, `S3LambdaToElasticRole`, {
            assumedBy: new CompositePrincipal(
                new ServicePrincipal("lambda.amazonaws.com"),
//                new ServicePrincipal("firehose.amazonaws.com")
            ),
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
                `${elasticProps.elasticArn}/*`,
                `${elasticProps.elasticArn}*`
            ]
        }));
        lambdaRole.addToPolicy(new PolicyStatement( {
            actions: [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
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
        }

        return lambdaMap;
    }

    createWebAcl(props: Props): any {
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

        return new CloudFrontWebDistribution(this, cloudfrontProps.distributionName, {
            originConfigs: originConfigs,
            aliasConfiguration: aliasConfig,
            loggingConfig: {
                bucket: bucket,
                prefix: 'logs'
            },
            webACLId: webAcl?.attrArn
        });
    }

}