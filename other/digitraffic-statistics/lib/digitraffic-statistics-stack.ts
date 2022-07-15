import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import {SecurityGroup} from 'aws-cdk-lib/aws-ec2';
import {Role} from 'aws-cdk-lib/aws-iam';
import cdk = require('aws-cdk-lib');
import {Construct} from "constructs";
import {Duration} from "aws-cdk-lib";
import {Vpc} from "aws-cdk-lib/aws-ec2";

const path = require('path');

interface StatisticsProps {
    readonly vpcName: string;
    readonly sgName: string;
    readonly roleArn: string;
    readonly certificateArn: string
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

        const sg = SecurityGroup.fromLookupByName(this, "digitraffic-monthly-sg", customProps.sgName, vpc);

        const digitrafficFiguresFunction = new lambda.DockerImageFunction(this, 'digitraffic-monthly', {
            functionName: "digitraffic-monthly",
            code: lambda.DockerImageCode.fromImageAsset(path.join(__dirname, '../digitraffic-figures/'), {}),
            vpc: vpc,
            securityGroups: [sg],
            role: Role.fromRoleArn(this, "digitraffic-figures-role", customProps.roleArn),
            architecture: lambda.Architecture.ARM_64,
            memorySize: 4096,
            timeout: Duration.seconds(40),
            environment: customProps.figuresLambdaEnv
        });

        const digitrafficFiguresLambdaIntegration = new apigw.LambdaIntegration(digitrafficFiguresFunction, {
            proxy: true
        });

        const restApi = new apigw.RestApi(this, "digitraffic-statistics-api", {
            restApiName: "digitraffic-statistics-api",
            deployOptions: {
                stageName: "prod"
            }
        });

        const digitrafficMonthly = restApi.root.addResource("digitraffic-monthly",
            {
                defaultIntegration: digitrafficFiguresLambdaIntegration,
            });
        digitrafficMonthly.addProxy({
            defaultIntegration: digitrafficFiguresLambdaIntegration,
            anyMethod: true
        })
        digitrafficMonthly.addMethod("GET");

        const domain = "statistics.digitraffic.fi";
        const domainName = new apigw.DomainName(this, 'domain', {
            domainName: domain,
            certificate: acm.Certificate.fromCertificateArn(this, "digitraffic-statistics-certificate", "arn:aws:acm:eu-west-1:370197853960:certificate/c382d868-fd6c-4d0c-970e-2eac98387a27"),
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
}
