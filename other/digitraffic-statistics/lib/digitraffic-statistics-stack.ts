import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import {Construct} from "constructs";
import {StatisticsIntegrations} from "./aws-integrations";
import {StatisticsApi} from "./api";
import cdk = require("aws-cdk-lib");

interface DigitrafficStatisticsProps {
    readonly vpcName: string;
    readonly dbSecretArn: string;
    readonly certificateArn: string,
    readonly visualizationsBucketArn: string,
    readonly rdsSgId: string,
    readonly allowedIpAddresses: string[],
    readonly domainName: string,
    readonly figuresLambdaEnv: {
        readonly API_GATEWAY_BASE_PATH: string,
        readonly API_GATEWAY_STAGE_PATH: string,
        readonly APP_ALL_TIME_WITH_TREND: string,
        readonly DASH_URL_BASE_PATHNAME: string,
        readonly DB_DATABASE: string,
        readonly DB_SECRET_ARN: string,
        readonly SECRET: string
    }
    readonly kibanaLambdaEnv: {
        readonly KIBANA_URL: string
    }
}

export class DigitrafficStatisticsStack extends cdk.Stack {

    readonly statisticsProps: DigitrafficStatisticsProps;

    constructor(scope: Construct, id: string, statisticsProps: DigitrafficStatisticsProps, props?: cdk.StackProps) {
        super(scope, id, props);

        this.statisticsProps = statisticsProps;

        const statisticsIntegrations = new StatisticsIntegrations(this);
        const statisticsApi = new StatisticsApi(this, statisticsIntegrations);

        this.setupStatisticsDomain(this, statisticsApi);
    }

    private setupStatisticsDomain(stack: DigitrafficStatisticsStack, statisticsApi: StatisticsApi) {
        const domainName = stack.statisticsProps.domainName;
        const apigwDomainName = new apigw.DomainName(this, 'domain', {
            domainName: domainName,
            certificate: acm.Certificate.fromCertificateArn(this, "digitraffic-statistics-certificate", stack.statisticsProps.certificateArn),
            endpointType: apigw.EndpointType.REGIONAL,
        });
        apigwDomainName.addBasePathMapping(statisticsApi.restApi,{stage: statisticsApi.restApi.deploymentStage});

        const zone = route53.HostedZone.fromLookup(this, "digitraffic-statistics-zone", {
            domainName: domainName,
        });
        new route53.ARecord(this, "digitraffic-statistics-api-dns", {
            zone: zone,
            recordName: domainName,
            target: route53.RecordTarget.fromAlias(new targets.ApiGatewayDomain(apigwDomainName)),
        });
    }
}
