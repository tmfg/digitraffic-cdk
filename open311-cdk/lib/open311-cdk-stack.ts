import cdk = require('@aws-cdk/core');
import apigateway = require('@aws-cdk/aws-apigateway');
import iam = require('@aws-cdk/aws-iam');

import * as integrationSwagger from './open311-swagger-integration';
import * as publicSwagger from './open311-swagger-public';

export class Open311CdkStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const role = new iam.Role(this, 'APIGatewayPushToCloudWatchLogsRole', {
            managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonAPIGatewayPushToCloudWatchLogs')],
            assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com')
        });

        new apigateway.CfnAccount(this, 'account', {
            cloudWatchRoleArn: role.roleArn
        });

        new apigateway.CfnRestApi(this, 'Open311-integration', {
            body: integrationSwagger.default,
            description: 'Open311 integration API',
            endpointConfiguration: {
                types: ['REGIONAL']
            }
        });

        new apigateway.CfnRestApi(this, 'Open311-public', {
            body: publicSwagger.default,
            description: 'Open311 public API',
            endpointConfiguration: {
                types: ['REGIONAL']
            }
        });
    }
}

const app = new cdk.App();
new Open311CdkStack(app, 'Open311');
app.synth();
