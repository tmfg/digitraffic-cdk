import * as cdk from '@aws-cdk/core';
import * as rds from '@aws-cdk/aws-rds';
import {CfnDBClusterProps} from '@aws-cdk/aws-rds';
import * as secretsmanager from '@aws-cdk/aws-secretsmanager'
import * as ssm from '@aws-cdk/aws-ssm';


export class EsKeyFiguresStack extends cdk.Stack {
  constructor(app: cdk.App, id: string, props?: cdk.StackProps) {
    super(app, id);

    const databaseUsername = 'movies-database';

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
        minCapacity: 0,
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
