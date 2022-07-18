import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import {Peer, Port, SecurityGroup, Vpc} from "aws-cdk-lib/aws-ec2";
import {Construct} from "constructs";
import {Duration} from "aws-cdk-lib";
import cdk = require("aws-cdk-lib");

const path = require("path");

interface StatisticsProps {
    readonly vpcName: string;
    readonly dbSecretArn: string;
    readonly certificateArn: string,
    readonly visualizationsBucketArn: string,
    readonly rdsSgId: string,
    readonly allowedIpAddresses: string[],
    readonly figuresLambdaEnv: {
        readonly API_GATEWAY_BASE_PATH: string,
        readonly API_GATEWAY_STAGE_PATH: string,
        readonly APP_ALL_TIME_WITH_TREND: string,
        readonly DASH_URL_BASE_PATHNAME: string,
        readonly DB_DATABASE: string,
        readonly DB_SECRET_ARN: string,
        readonly SECRET: string
    }
}

export class DigitrafficStatisticsStack extends cdk.Stack {

    constructor(scope: Construct, id: string, customProps: StatisticsProps, props?: cdk.StackProps) {
        super(scope, id, props);

        const vpc = Vpc.fromLookup(this, "EsKeyFiguresVPC", {
            vpcName: customProps.vpcName
        });

        const digitrafficMonthlySg = new SecurityGroup(this, "digitraffic-monthly-sg", {
            vpc,
            allowAllOutbound: true,
            securityGroupName: "digitraffic-monthly-sg"
        });

        const RDSEsKeyFiguresSG = SecurityGroup.fromLookupById(this, "es-key-figures-sg", customProps.rdsSgId);
        RDSEsKeyFiguresSG.addIngressRule(
            Peer.securityGroupId(digitrafficMonthlySg.securityGroupId),
            Port.tcp(3306)
        );

        const digitrafficMonthlyFunction = new lambda.DockerImageFunction(this, 'digitraffic-monthly', {
            functionName: "digitraffic-monthly",
            code: lambda.DockerImageCode.fromImageAsset(path.join(__dirname, '../digitraffic-figures/'), {}),
            vpc: vpc,
            securityGroups: [digitrafficMonthlySg],
            role: this.createDigitrafficMonthlyLambdaRole(customProps.dbSecretArn),
            architecture: lambda.Architecture.ARM_64,
            memorySize: 4096,
            timeout: Duration.seconds(60),
            environment: customProps.figuresLambdaEnv
        });
        const digitrafficMonthlyLambdaIntegration = new apigw.LambdaIntegration(digitrafficMonthlyFunction, {
            proxy: true
        });

        const apiStatisticsBucket = s3.Bucket.fromBucketArn(this, "api-statistics-bucket", customProps.visualizationsBucketArn);
        const apiStatisticsS3Integration = new apigw.AwsIntegration({
            service: "s3",
            integrationHttpMethod: "GET",
            path: `${apiStatisticsBucket.bucketName}/index.html`,
            options: {
                credentialsRole: this.createS3ExecutionRole(apiStatisticsBucket),
                integrationResponses: [{
                    statusCode: "200",
                    responseParameters: {
                        'method.response.header.Content-Type': "'text/html'",
                    },
                }]
            }
        })

        const restApi = new apigw.RestApi(this, "digitraffic-statistics-api", {
            restApiName: "digitraffic-statistics-api",
            policy: this.createApiIpRestrictionPolicy(customProps.allowedIpAddresses),
            deployOptions: {
                stageName: "prod"
            }
        });

        const digitrafficApiStatistics = restApi.root.addResource("digitraffic-api-statistics");
        digitrafficApiStatistics.addMethod("GET", apiStatisticsS3Integration, {
            methodResponses: [{
                statusCode: "200",
                responseParameters: {
                    'method.response.header.Content-Type': true,
                }
            }]
        });

        const digitrafficMonthly = restApi.root.addResource("digitraffic-monthly",
            {
                defaultIntegration: digitrafficMonthlyLambdaIntegration,
            });
        digitrafficMonthly.addProxy({
            defaultIntegration: digitrafficMonthlyLambdaIntegration,
            anyMethod: true
        })
        digitrafficMonthly.addMethod("GET");

        const domain = "statistics.digitraffic.fi";
        const domainName = new apigw.DomainName(this, 'domain', {
            domainName: domain,
            certificate: acm.Certificate.fromCertificateArn(this, "digitraffic-statistics-certificate", customProps.certificateArn),
            endpointType: apigw.EndpointType.REGIONAL
        });
        domainName.addBasePathMapping(restApi,{stage: restApi.deploymentStage});

        const zone = route53.HostedZone.fromLookup(this, "digitraffic-statistics-zone", {
            domainName: domain,
        });
        new route53.ARecord(this, "digitraffic-statistics-api-dns", {
            zone: zone,
            recordName: domain,
            target: route53.RecordTarget.fromAlias(
                new targets.ApiGatewayDomain(domainName)
            ),
        });
    }

    private createApiIpRestrictionPolicy(allowedIpAddresses) {
        return new iam.PolicyDocument({
            statements: [
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ["execute-api:Invoke"],
                    principals: [new iam.AnyPrincipal()],
                    resources: ["*"]
                }),
                new iam.PolicyStatement({
                    effect: iam.Effect.DENY,
                    actions: ["execute-api:Invoke"],
                    conditions: {
                        "NotIpAddress": {
                            "aws:SourceIp": allowedIpAddresses
                        }
                    },
                    principals: [new iam.AnyPrincipal()],
                    resources: ["*"],
                })
            ]
        })
    }

    private createDigitrafficMonthlyLambdaRole(dbSecretArn: string) {
        const lambdaRole = new iam.Role(this, "digitraffic-monthly-lambda-role", {
            assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
            roleName: "digitraffic-monthly-lambda-role",
        });
        lambdaRole.addToPolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    "ec2:CreateNetworkInterface",
                    "logs:CreateLogStream",
                    "ec2:DescribeNetworkInterfaces",
                    "logs:DescribeLogGroups",
                    "logs:DescribeLogStreams",
                    "ec2:DeleteNetworkInterface",
                    "logs:CreateLogGroup",
                    "logs:PutLogEvents"
                ],
                resources: ["*"]
            })
        )
        lambdaRole.addToPolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ["secretsmanager:GetSecretValue"],
                resources: [dbSecretArn]
            })
        )
        lambdaRole.addToPolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    "xray:PutTraceSegments",
                    "xray:PutTelemetryRecords"
                ],
                resources: ["*"],
            })
        )
        lambdaRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("CloudWatchLambdaInsightsExecutionRolePolicy"));

        return lambdaRole;
    }

    private createS3ExecutionRole(bucket: s3.IBucket) {
        const executeRole = new iam.Role(this, "digitraffic-api-statistics-apigw-s3-integration-role", {
            assumedBy: new iam.ServicePrincipal("apigateway.amazonaws.com"),
            roleName: "digitraffic-api-statistics-apigw-s3-integration-role",
        });
        executeRole.addToPolicy(
            new iam.PolicyStatement({
                resources: [`${bucket.bucketArn}/*`],
                actions: ["s3:GetObject"],
            })
        );
        return executeRole;
    }
}
