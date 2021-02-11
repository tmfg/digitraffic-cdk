import {App, Duration, Stack, StackProps} from '@aws-cdk/core';
import {DatabaseClusterEngine, ServerlessCluster, ServerlessClusterProps} from '@aws-cdk/aws-rds';
import {Secret} from '@aws-cdk/aws-secretsmanager'
import {StringParameter} from '@aws-cdk/aws-ssm';
import {PolicyStatement, Role, ServicePrincipal} from '@aws-cdk/aws-iam';
import {RetentionDays} from '@aws-cdk/aws-logs';
import {AssetCode, Function, Runtime} from '@aws-cdk/aws-lambda';
import {Rule, Schedule} from '@aws-cdk/aws-events'
import {LambdaFunction} from '@aws-cdk/aws-events-targets'
import {Peer, Port, SecurityGroup, Vpc} from "@aws-cdk/aws-ec2";

export interface Props {
  elasticSearchEndpoint: string;
  elasticSearchDomainArn: string;
  slackWebhook: string;
  mysql: { password: string; database: string; host: string; user: string }
}

const allowedIps = [
  "0.0.0.0/0"
];

export class EsKeyFiguresStack extends Stack {
  constructor(app: App, id: string, esKeyFiguresProps: Props, props?: StackProps) {
    super(app, id, props);
    const vpc = this.createVpc();
    const sg = this.createSecurityGroup(allowedIps, vpc);

    const serverlessCluster = this.createDatabase(esKeyFiguresProps.mysql.database, id, vpc, sg);

    const lambdaRole = new Role(this, "CollectEsKeyFiguresRole", {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
      roleName: "CollectEsKeyFiguresRole"
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
          esKeyFiguresProps.elasticSearchDomainArn,
          `${esKeyFiguresProps.elasticSearchDomainArn}/*`
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
          'ec2:CreateNetworkInterface', 'ec2:DescribeNetworkInterfaces', 'ec2:DeleteNetworkInterface'
        ],
        resources: ["*"]
      })
    );

    let functionName = 'CollectEsKeyFigures';
    const lambdaConf = {
      role: lambdaRole,
      functionName: functionName,
      code: new AssetCode('dist/lambda'),
      handler: 'collect-es-key-figures.handler',
      runtime: Runtime.NODEJS_10_X,
      timeout: Duration.minutes(15),
      logRetention: RetentionDays.ONE_YEAR,
      vpc: vpc,
      memorySize: 256,
      environment: {
        ES_ENDPOINT: esKeyFiguresProps.elasticSearchEndpoint,
        MYSQL_ENDPOINT: serverlessCluster.clusterEndpoint.hostname,
        MYSQL_USERNAME: esKeyFiguresProps.mysql.user,
        MYSQL_PASSWORD: esKeyFiguresProps.mysql.password,
        MYSQL_DATABASE: esKeyFiguresProps.mysql.database,
        SLACK_WEBHOOK: esKeyFiguresProps.slackWebhook
      }
    };
    const collectEsKeyFiguresLambda = new Function(this, functionName, lambdaConf);

    const rule = new Rule(this, 'Rule', {
      schedule: Schedule.expression('cron(30 3 1 * ? *)')
    });

    const target = new LambdaFunction(collectEsKeyFiguresLambda);
    rule.addTarget(target);
  }

  private createVpc(): Vpc {
    return new Vpc(this, 'EsKeyFiguresVPC', {
      natGateways: 1,
      maxAzs: 2
    });
  }

  private createSecurityGroup(solitaCidrs: string[], vpc: Vpc): SecurityGroup {
    const jenkinsSg = new SecurityGroup(this, 'EsKeyFiguresSG', {
      vpc,
      securityGroupName: 'EsKeyFiguresSG',
      allowAllOutbound: true
    });
    solitaCidrs.forEach(ip => {
      jenkinsSg.addIngressRule(Peer.ipv4(ip),
        Port.tcp(3306),
        '',
        false);
    });
    return jenkinsSg;
  }

  private createDatabase(name: string, id: string, vpc: Vpc, sg: SecurityGroup): ServerlessCluster {
    const databaseUsername = 'eskeyfiguredb';

    const databaseCredentialsSecret = new Secret(this, 'DBCredentialsSecret', {
      secretName: `${id}-credentials`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: databaseUsername,
        }),
        excludePunctuation: true,
        includeSpace: false,
        generateStringKey: 'password'
      }
    });

    new StringParameter(this, 'DBCredentialsArn', {
      parameterName: `${id}-credentials-arn`,
      stringValue: databaseCredentialsSecret.secretArn,
    });

    const dbConfig: ServerlessClusterProps = {
      clusterIdentifier: `main-${id}-cluster`,
      engine: DatabaseClusterEngine.AURORA_MYSQL,
      vpc: vpc,
      securityGroups: [sg],
      deletionProtection: false,
      defaultDatabaseName: name,
      enableDataApi: true,
      credentials: {
        username: databaseCredentialsSecret.secretValueFromJson('username').toString(),
        password: databaseCredentialsSecret.secretValueFromJson('password')
      },
      backupRetention: Duration.days(14),
      scaling: {
        autoPause: Duration.hours(1),
        maxCapacity: 4,
        minCapacity: 2,
      }
    };

    const cluster = new ServerlessCluster(this, 'DBCluster', dbConfig);

    new StringParameter(this, 'DBResourceArn', {
      parameterName: `${id}-resource-arn`,
      stringValue: cluster.clusterArn,
    });

    return cluster
  }
}
