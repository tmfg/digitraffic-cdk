import cdk = require('@aws-cdk/core');
import apigateway = require('@aws-cdk/aws-apigateway');

import {MockIntegration, PassthroughBehavior} from "@aws-cdk/aws-apigateway";

export class Open311CdkStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const integrationApi = new apigateway.RestApi(this, 'Open311-integration', {
            restApiName: 'Open311 integration API',
        });

        const requests = integrationApi.root.addResource("requests");
        requests.addMethod("POST", new MockIntegration({
            passthroughBehavior: PassthroughBehavior.WHEN_NO_MATCH,
            requestTemplates: {
                'application/json': JSON.stringify({statusCode: 200})
            },
            integrationResponses: [
                {
                    statusCode: '200'
                }
            ]
        }), {
            methodResponses: [
                {
                    statusCode: '200'
                }
            ]
        });
        requests.addMethod("PUT", new MockIntegration({
            passthroughBehavior: PassthroughBehavior.WHEN_NO_MATCH,
            requestTemplates: {
                'application/json': JSON.stringify({statusCode: 200})
            },
            integrationResponses: [
                {
                    statusCode: '200'
                }
            ]
        }), {
            methodResponses: [
                {
                    statusCode: '200'
                }
            ]
        });
    }
}

const app = new cdk.App();
new Open311CdkStack(app, 'Open311');
app.synth();
