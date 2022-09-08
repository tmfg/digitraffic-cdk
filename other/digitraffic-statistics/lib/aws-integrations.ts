import {AwsIntegration, LambdaIntegration} from "aws-cdk-lib/aws-apigateway";
import {Bucket} from "aws-cdk-lib/aws-s3";
import {DigitrafficStatisticsStack} from "./digitraffic-statistics-stack";
import * as lambda from "aws-cdk-lib/aws-lambda";
import path from "path";
import {Duration} from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import {IVpc, Peer, Port, SecurityGroup, Vpc} from "aws-cdk-lib/aws-ec2";

export class StatisticsIntegrations {

    readonly apiStatisticsS3Integration: AwsIntegration;
    readonly digitrafficMonthlyLambdaIntegration: LambdaIntegration;
    readonly kibanaRedirectLambdaIntegration: LambdaIntegration;

    constructor(stack: DigitrafficStatisticsStack) {

        const vpc = Vpc.fromLookup(stack, "EsKeyFiguresVPC", {
            vpcName: stack.statisticsProps.vpcName,
        });

        const digitrafficMonthlySg = new SecurityGroup(stack, "digitraffic-monthly-sg", {
            vpc,
            allowAllOutbound: true,
            securityGroupName: "digitraffic-monthly-sg",
        });

        this.createDbAccessIngressRule(stack, digitrafficMonthlySg);

        this.apiStatisticsS3Integration = this.createApiStatisticsS3Integration(stack);
        this.digitrafficMonthlyLambdaIntegration = this.createDigitrafficMonthlyLambdaIntegration(stack, vpc, digitrafficMonthlySg);
        this.kibanaRedirectLambdaIntegration = this.createKibanaRedirectLambdaIntegration(stack);

    }

    private createDbAccessIngressRule(stack: DigitrafficStatisticsStack, sg: SecurityGroup) {
        const rdsEsKeyFiguresSg = SecurityGroup.fromLookupById(stack, "es-key-figures-sg", stack.statisticsProps.rdsSgId);
        rdsEsKeyFiguresSg.addIngressRule(Peer.securityGroupId(sg.securityGroupId),
            Port.tcp(3306));
    }

    private createDigitrafficMonthlyLambdaIntegration(stack: DigitrafficStatisticsStack, vpc: IVpc, sg: SecurityGroup): LambdaIntegration {
        const digitrafficMonthlyFunction = new lambda.DockerImageFunction(stack, 'digitraffic-monthly', {
            functionName: "digitraffic-monthly",
            code: lambda.DockerImageCode.fromImageAsset(path.join(__dirname, '../digitraffic-figures/'), {}),
            vpc: vpc,
            securityGroups: [sg],
            role: this.createDigitrafficMonthlyLambdaRole(stack),
            architecture: lambda.Architecture.ARM_64,
            memorySize: 4096,
            timeout: Duration.seconds(60),
            environment: stack.statisticsProps.figuresLambdaEnv,
        });

        return new LambdaIntegration(digitrafficMonthlyFunction, {
            proxy: true,
        });
    }

    private createKibanaRedirectLambdaIntegration(stack: DigitrafficStatisticsStack) {
        const kibanaRedirectFunction = new lambda.Function(stack, "kibana-redirect", {
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: "kibana-redirect.handler",
            code: lambda.Code.fromAsset(path.join(__dirname, '/lambda')),
            environment: stack.statisticsProps.kibanaLambdaEnv
        });
        return new LambdaIntegration(kibanaRedirectFunction);
    }

    private createApiStatisticsS3Integration(stack: DigitrafficStatisticsStack): AwsIntegration {
        const apiStatisticsBucket = Bucket.fromBucketArn(stack, "api-statistics-bucket", stack.statisticsProps.visualizationsBucketArn);
        return new AwsIntegration({
            service: "s3",
            integrationHttpMethod: "GET",
            path: `${apiStatisticsBucket.bucketName}/index.html`,
            options: {
                credentialsRole: this.createS3ExecutionRole(stack, apiStatisticsBucket),
                integrationResponses: [{
                    statusCode: "200",
                    responseParameters: {
                        'method.response.header.Content-Type': "'text/html'",
                    },
                }],
            },
        });
    }

    private createS3ExecutionRole(stack: DigitrafficStatisticsStack, bucket: s3.IBucket): iam.Role {
        const executeRole = new iam.Role(stack, "digitraffic-api-statistics-apigw-s3-integration-role", {
            assumedBy: new iam.ServicePrincipal("apigateway.amazonaws.com"),
            roleName: "digitraffic-api-statistics-apigw-s3-integration-role",
        });
        executeRole.addToPolicy(new iam.PolicyStatement({
            resources: [`${bucket.bucketArn}/*`],
            actions: ["s3:GetObject"],
        }));
        return executeRole;
    }

    private createDigitrafficMonthlyLambdaRole(stack: DigitrafficStatisticsStack): iam.Role {
        const lambdaRole = new iam.Role(stack, "digitraffic-monthly-lambda-role", {
            assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
            roleName: "digitraffic-monthly-lambda-role",
        });
        lambdaRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                "ec2:CreateNetworkInterface",
                "logs:CreateLogStream",
                "ec2:DescribeNetworkInterfaces",
                "logs:DescribeLogGroups",
                "logs:DescribeLogStreams",
                "ec2:DeleteNetworkInterface",
                "logs:CreateLogGroup",
                "logs:PutLogEvents",
            ],
            resources: ["*"],
        }));
        lambdaRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ["secretsmanager:GetSecretValue"],
            resources: [stack.statisticsProps.dbSecretArn],
        }));
        lambdaRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                "xray:PutTraceSegments",
                "xray:PutTelemetryRecords",
            ],
            resources: ["*"],
        }));
        lambdaRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("CloudWatchLambdaInsightsExecutionRolePolicy"));

        return lambdaRole;
    }

}