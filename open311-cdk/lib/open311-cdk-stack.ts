import cdk = require('@aws-cdk/core');
import apigateway = require('@aws-cdk/aws-apigateway');
import iam = require('@aws-cdk/aws-iam');
const lambda = require('@aws-cdk/aws-lambda');
import {EndpointType, LambdaIntegration} from "@aws-cdk/aws-apigateway";

export class Open311CdkStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const newRequestHandler = new lambda.Function(this, 'NewRequestLambda', {
            code: new lambda.AssetCode('lib'),
            handler: 'newrequest.handler',
            runtime: lambda.Runtime.NODEJS_10_X
        });
        const newRequestIntegration = new LambdaIntegration(newRequestHandler);
        const integrationApi = new apigateway.RestApi(this, 'Open311-integration', {
            restApiName: 'Open311 integration API',
            endpointTypes: [EndpointType.PRIVATE],
            policy: new iam.PolicyDocument({
                statements: [
                    new iam.PolicyStatement({
                        effect: iam.Effect.ALLOW,
                        actions: [
                            "execute-api:Invoke"
                        ],
                        resources: [
                            "*"
                        ],
                        conditions: {
                            "StringEquals": {
                                "aws:sourceVpc": process.env.VPC_ID as string
                            }
                        },
                        principals: [
                            new iam.AnyPrincipal()
                        ]
                    })
                ]
            })
        });
        const requests = integrationApi.root.addResource("requests");
        requests.addMethod("POST", newRequestIntegration, {
            apiKeyRequired: true
        });
        integrationApi.addApiKey(process.env.API_KEY as string);
    }
}

const app = new cdk.App();
new Open311CdkStack(app, 'Open311', {
    env: {
        account: process.env.CDK_DEPLOY_ACCOUNT,
        region: process.env.CDK_DEPLOY_REGION
    }
});
app.synth();
