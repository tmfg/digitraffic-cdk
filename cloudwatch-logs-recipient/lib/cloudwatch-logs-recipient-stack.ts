///<reference path="../lib/app-props.d.ts"/>
import cdk = require('@aws-cdk/core');
import * as iam from '@aws-cdk/aws-iam';
import * as logs from '@aws-cdk/aws-logs';
import * as kinesis from '@aws-cdk/aws-kinesis';

export class CloudWatchLogsRecipientStack extends cdk.Stack {

    constructor(scope: cdk.Construct, id: string, cwlrProps: Props, props?: cdk.StackProps) {
        super(scope, id, props);

        const recipientStream = new kinesis.Stream(this, 'CWLRecipientStream', {
            shardCount: 1,
            streamName: 'CWLRecipientStream'
        });

        const cloudWatchLogsToKinesisRole = new iam.Role(this, 'CWLToKinesisRole', {
            assumedBy: new iam.ServicePrincipal(
                `logs.${this.region}.amazonaws.com`
            ),
            roleName: 'CWLToKinesisRole'
        });

        cloudWatchLogsToKinesisRole.addToPolicy(
            new iam.PolicyStatement({
                actions: ['kinesis:PutRecord'],
                resources: [recipientStream.streamArn]
            })
        );
        cloudWatchLogsToKinesisRole.addToPolicy(
            new iam.PolicyStatement({
                actions: ['iam:PassRole'],
                resources: [cloudWatchLogsToKinesisRole.roleArn]
            })
        );

        const crossAccountDestinationId = 'CrossAccountDestination'
        // KinesisDestination requires reference to LogGroup which exists in another stack
        const crossAccountDestination = new logs.CrossAccountDestination(
            this,
            crossAccountDestinationId,
            {
                destinationName: crossAccountDestinationId,
                targetArn: recipientStream.streamArn,
                role: cloudWatchLogsToKinesisRole
            }
        );
        crossAccountDestination.node.addDependency(cloudWatchLogsToKinesisRole);
        (crossAccountDestination.node.defaultChild as logs.CfnDestination).destinationPolicy = JSON.stringify({
            Version: '2012-10-17',
            Statement: [
                {
                    Sid: 'AllowSenderAccountsToSubscribe',
                    Effect: 'Allow',
                    Action: 'logs:PutSubscriptionFilter',
                    Principal: {
                        AWS: [
                            cwlrProps.applicationAccountId
                        ]
                    },
                    Resource: `arn:aws:logs:${this.region}:${this.account}:destination:${crossAccountDestinationId}`
                }
            ]
        });

    }

}
