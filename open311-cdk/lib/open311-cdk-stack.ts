import cdk = require('@aws-cdk/core');
import * as IntegrationApi from './integration-api';
import * as PublicApi from './public-api';
import * as TestStackProps from './stackprops-test';

export class Open311CdkStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        IntegrationApi.create(this);
        PublicApi.create(this, TestStackProps.default.dbProps);
    }
}

const app = new cdk.App();
new Open311CdkStack(app, 'Open311-test', TestStackProps.default.stackProps);
app.synth();
