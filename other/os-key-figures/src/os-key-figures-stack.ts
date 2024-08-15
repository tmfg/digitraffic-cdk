import { App, Duration, Stack, type StackProps } from "aws-cdk-lib";
import { DatabaseClusterEngine, ServerlessCluster, type ServerlessClusterProps } from "aws-cdk-lib/aws-rds";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { AnyPrincipal, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { AssetCode, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import * as events from "aws-cdk-lib/aws-events";
import { Rule, Schedule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { Peer, Port, SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";
import * as s3 from "aws-cdk-lib/aws-s3";

export interface Props {
    readonly openSearchEndpoint: string;
    readonly openSearchDomainArn: string;
    readonly slackWebhook: string;
    readonly mysql: {
        readonly password: string;
        readonly database: string;
        readonly host: string;
        readonly user: string;
    };
    readonly allowedIpAddresses: string[];
    readonly marineAccountName: string;
    readonly railAccountName: string;
    readonly roadAccountName: string;
}

const allowedIps = ["0.0.0.0/0"];

export class OsKeyFiguresStack extends Stack {
    constructor(app: App, id: string, osKeyFiguresProps: Props, props?: StackProps) {
        super(app, id, props);
        const vpc = this.createVpc();
        const sg = this.createSecurityGroup(allowedIps, vpc);

        const serverlessCluster = this.createDatabase(osKeyFiguresProps.mysql.database, id, vpc, sg);

        this.createCollectOsKeyFiguresLambda(osKeyFiguresProps, vpc, serverlessCluster);
        this.createVisualizationsLambda(osKeyFiguresProps, vpc, serverlessCluster);
    }

    private createVisualizationsLambda(
        osKeyFiguresProps: Props,
        vpc: Vpc,
        serverlessCluster: ServerlessCluster
    ) {
        const lambdaRole = new Role(this, "CreateVisualizationsRole", {
            assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
            roleName: "CreateVisualizationsRoleRole"
        });

        const htmlBucket = new s3.Bucket(this, "os-key-figure-visualizations", {
            versioned: false
        });

        htmlBucket.addToResourcePolicy(
            new PolicyStatement({
                actions: ["s3:GetObject"],
                principals: [new AnyPrincipal()],
                resources: [htmlBucket.bucketArn + "/*"],
                conditions: {
                    IpAddress: {
                        "aws:SourceIp": osKeyFiguresProps.allowedIpAddresses
                    }
                }
            })
        );

        lambdaRole.addToPolicy(
            new PolicyStatement({
                actions: [
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                    "logs:CreateLogGroup",
                    "logs:DescribeLogGroups",
                    "logs:DescribeLogStreams",
                    "s3:PutObject",
                    "s3:PutObjectAcl"
                ],
                resources: ["*", htmlBucket.bucketArn + "/*"]
            })
        );

        const functionName = "CreateVisualizations";
        const lambdaConf = {
            role: lambdaRole,
            functionName: functionName,
            code: new AssetCode("dist/lambda"),
            handler: "create-visualizations.handler",
            runtime: Runtime.NODEJS_20_X,
            timeout: Duration.minutes(15),
            logRetention: RetentionDays.ONE_YEAR,
            vpc: vpc,
            memorySize: 256,
            environment: {
                MYSQL_ENDPOINT: serverlessCluster.clusterEndpoint.hostname,
                MYSQL_USERNAME: osKeyFiguresProps.mysql.user,
                MYSQL_PASSWORD: osKeyFiguresProps.mysql.password,
                MYSQL_DATABASE: osKeyFiguresProps.mysql.database,
                SLACK_WEBHOOK: osKeyFiguresProps.slackWebhook
            }
        };
        const lambdaFunction = new Function(this, functionName, lambdaConf);

        const rule = new Rule(this, "create visualizations dummy", {
            schedule: Schedule.expression("cron(0 5 1 * ? *)")
        });

        const target = new LambdaFunction(lambdaFunction);
        rule.addTarget(target);
    }

    private createCollectOsKeyFiguresLambda(
        osKeyFiguresProps: Props,
        vpc: Vpc,
        serverlessCluster: ServerlessCluster
    ) {
        const lambdaRole = new Role(this, "CollectOsKeyFiguresRole", {
            assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
            roleName: "CollectOsKeyFiguresRole"
        });

        lambdaRole.addToPolicy(
            new PolicyStatement({
                actions: [
                    "es:DescribeElasticsearchDomain",
                    "es:DescribeElasticsearchDomains",
                    "es:DescribeElasticsearchDomainConfig",
                    "es:ESHttpPost",
                    "es:ESHttpPut"
                ],
                resources: [
                    osKeyFiguresProps.openSearchDomainArn,
                    `${osKeyFiguresProps.openSearchDomainArn}/*`
                ]
            })
        );
        lambdaRole.addToPolicy(
            new PolicyStatement({
                actions: [
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                    "logs:CreateLogGroup",
                    "logs:DescribeLogGroups",
                    "logs:DescribeLogStreams",
                    "ec2:CreateNetworkInterface",
                    "ec2:DescribeNetworkInterfaces",
                    "ec2:DeleteNetworkInterface"
                ],
                resources: ["*"]
            })
        );

        const functionName = "CollectOsKeyFigures";
        const lambdaConf = {
            role: lambdaRole,
            functionName: functionName,
            code: new AssetCode("dist/lambda"),
            handler: "collect-os-key-figures.handler",
            runtime: Runtime.NODEJS_20_X,
            timeout: Duration.minutes(15),
            logRetention: RetentionDays.ONE_YEAR,
            vpc: vpc,
            memorySize: 256,
            environment: {
                OS_ENDPOINT: osKeyFiguresProps.openSearchEndpoint,
                MYSQL_ENDPOINT: serverlessCluster.clusterEndpoint.hostname,
                MYSQL_USERNAME: osKeyFiguresProps.mysql.user,
                MYSQL_PASSWORD: osKeyFiguresProps.mysql.password,
                MYSQL_DATABASE: osKeyFiguresProps.mysql.database,
                SLACK_WEBHOOK: osKeyFiguresProps.slackWebhook,
                MARINE_ACCOUNT_NAME: osKeyFiguresProps.marineAccountName,
                RAIL_ACCOUNT_NAME: osKeyFiguresProps.railAccountName,
                ROAD_ACCOUNT_NAME: osKeyFiguresProps.roadAccountName
            }
        };
        const collectOsKeyFiguresLambda = new Function(this, functionName, lambdaConf);

        const rule = new Rule(this, "collect *", {
            schedule: Schedule.expression("cron(0 3 1 * ? *)")
        });
        rule.addTarget(
            new LambdaFunction(collectOsKeyFiguresLambda, {
                event: events.RuleTargetInput.fromObject({ TRANSPORT_TYPE: "*" })
            })
        );

        const rule2 = new Rule(this, "collect rail", {
            schedule: Schedule.expression("cron(15 3 1 * ? *)")
        });
        rule2.addTarget(
            new LambdaFunction(collectOsKeyFiguresLambda, {
                event: events.RuleTargetInput.fromObject({ TRANSPORT_TYPE: "rail" })
            })
        );

        const rule3 = new Rule(this, "collect marine", {
            schedule: Schedule.expression("cron(30 3 1 * ? *)")
        });
        rule3.addTarget(
            new LambdaFunction(collectOsKeyFiguresLambda, {
                event: events.RuleTargetInput.fromObject({ TRANSPORT_TYPE: "marine" })
            })
        );

        const rule1 = new Rule(this, "collect road 1", {
            schedule: Schedule.expression("cron(45 3 1 * ? *)")
        });
        rule1.addTarget(
            new LambdaFunction(collectOsKeyFiguresLambda, {
                event: events.RuleTargetInput.fromObject({
                    TRANSPORT_TYPE: "road",
                    PART: 1
                })
            })
        );

        const rule4 = new Rule(this, "collect road 2", {
            schedule: Schedule.expression("cron(1 4 1 * ? *)")
        });
        rule4.addTarget(
            new LambdaFunction(collectOsKeyFiguresLambda, {
                event: events.RuleTargetInput.fromObject({
                    TRANSPORT_TYPE: "road",
                    PART: 2
                })
            })
        );
    }

    private createVpc(): Vpc {
        return new Vpc(this, "OsKeyFiguresVPC", {
            natGateways: 1,
            maxAzs: 2
        });
    }

    private createSecurityGroup(solitaCidrs: string[], vpc: Vpc): SecurityGroup {
        const jenkinsSg = new SecurityGroup(this, "OsKeyFiguresSG", {
            vpc,
            securityGroupName: "OsKeyFiguresSG",
            allowAllOutbound: true
        });
        solitaCidrs.forEach((ip) => {
            jenkinsSg.addIngressRule(Peer.ipv4(ip), Port.tcp(3306), "", false);
        });
        return jenkinsSg;
    }

    private createDatabase(name: string, id: string, vpc: Vpc, sg: SecurityGroup): ServerlessCluster {
        const databaseUsername = "oskeyfiguredb";

        const databaseCredentialsSecret = new Secret(this, "DBCredentialsSecret", {
            secretName: `${id}-credentials`,
            generateSecretString: {
                secretStringTemplate: JSON.stringify({
                    username: databaseUsername
                }),
                excludePunctuation: true,
                includeSpace: false,
                generateStringKey: "password"
            }
        });

        new StringParameter(this, "DBCredentialsArn", {
            parameterName: `${id}-credentials-arn`,
            stringValue: databaseCredentialsSecret.secretArn
        });

        const dbConfig: ServerlessClusterProps = {
            clusterIdentifier: `main-${id}-cluster`,
            engine: DatabaseClusterEngine.AURORA_MYSQL,
            vpc: vpc,
            securityGroups: [sg],
            deletionProtection: true,
            defaultDatabaseName: name,
            enableDataApi: true,
            credentials: {
                username: databaseCredentialsSecret.secretValueFromJson("username").toString(),
                password: databaseCredentialsSecret.secretValueFromJson("password")
            },
            backupRetention: Duration.days(14),
            scaling: {
                autoPause: Duration.hours(1),
                maxCapacity: 4,
                minCapacity: 2
            }
        };

        const cluster = new ServerlessCluster(this, "DBCluster", dbConfig);

        new StringParameter(this, "DBResourceArn", {
            parameterName: `${id}-resource-arn`,
            stringValue: cluster.clusterArn
        });

        return cluster;
    }
}
