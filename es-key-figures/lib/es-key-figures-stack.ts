import * as cdk from '@aws-cdk/core';
import {Duration} from '@aws-cdk/core';
import * as rds from '@aws-cdk/aws-rds';
import {CfnDBClusterProps} from '@aws-cdk/aws-rds';
import * as secretsmanager from '@aws-cdk/aws-secretsmanager'
import * as ssm from '@aws-cdk/aws-ssm';
import * as iam from '@aws-cdk/aws-iam';
import * as logs from '@aws-cdk/aws-logs';
import * as lambda from '@aws-cdk/aws-lambda';

export interface Props {
  elasticSearchEndpoint: string;
  elasticSearchDomainArn: string;
}

export class EsKeyFiguresStack extends cdk.Stack {
  constructor(app: cdk.App, id: string, esKeyFiguresProps: Props, props?: cdk.StackProps) {
    super(app, id, props);
    this.createDatabase(id);

    const lambdaRole = new iam.Role(this, "CollectEsKeyFiguresRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      roleName: "CollectEsKeyFiguresRole"
    });
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
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
      new iam.PolicyStatement({
        actions: [
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:CreateLogGroup",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ],
        resources: ["*"]
      })
    );

    let functionName = 'CollectEsKeyFigures';
    const lambdaConf = {
      role: lambdaRole,
      functionName: functionName,
      code: new lambda.AssetCode('dist/lambda'),
      handler: 'collect-es-key-figures.handler',
      runtime: lambda.Runtime.NODEJS_10_X,
      timeout: Duration.seconds(10),
      logRetention: logs.RetentionDays.ONE_YEAR,
      environment: {
        ES_ENDPOINT: esKeyFiguresProps.elasticSearchEndpoint
      }
    };
    const kinesisToESLambda = new lambda.Function(this, functionName, lambdaConf);
  }

  private createDatabase(id: string): void {
    const databaseUsername = 'eskeyfiguredb';

    const databaseCredentialsSecret = new secretsmanager.Secret(this, 'DBCredentialsSecret', {
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

    new ssm.StringParameter(this, 'DBCredentialsArn', {
      parameterName: `${id}-credentials-arn`,
      stringValue: databaseCredentialsSecret.secretArn,
    });

    const dbConfig: CfnDBClusterProps = {
      dbClusterIdentifier: `main-${id}-cluster`,
      engineMode: 'serverless',
      engine: 'aurora-postgresql',
      engineVersion: '10.7',
      enableHttpEndpoint: true,
      deletionProtection: true,
      databaseName: 'main',
      masterUsername: databaseCredentialsSecret.secretValueFromJson('username').toString(),
      masterUserPassword: databaseCredentialsSecret.secretValueFromJson('password').toString(),
      backupRetentionPeriod: 14,
      scalingConfiguration: {
        autoPause: true,
        maxCapacity: 4,
        minCapacity: 2,
        secondsUntilAutoPause: 3600,
      }
    };

    const rdsCluster = new rds.CfnDBCluster(this, 'DBCluster', dbConfig);

    const dbClusterArn = `arn:aws:rds:${this.region}:${this.account}:cluster:${rdsCluster.ref}`;

    new ssm.StringParameter(this, 'DBResourceArn', {
      parameterName: `${id}-resource-arn`,
      stringValue: dbClusterArn,
    });
  }
}
