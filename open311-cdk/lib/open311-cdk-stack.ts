import cdk = require('@aws-cdk/core');
import * as IntegrationApi from './integration-api';
import * as PublicApi from './public-api';
import * as TestStackProps from '../stackprops-test';
import * as ec2 from "@aws-cdk/aws-ec2";

export class Open311CdkStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const open311Props = TestStackProps.default;

        const vpc = ec2.Vpc.fromVpcAttributes(this, 'vpc', {
            vpcId: open311Props.vpcId,
            privateSubnetIds: open311Props.privateSubnetIds,
            availabilityZones: open311Props.availabilityZones
        });
        const lambdaDbSg = ec2.SecurityGroup.fromSecurityGroupId(this, 'LambdaDbSG', open311Props.lambdaDbSgId);

        IntegrationApi.create(vpc, lambdaDbSg, this, open311Props);
        PublicApi.create(vpc, lambdaDbSg, this, open311Props);
    }
}

const app = new cdk.App();
new Open311CdkStack(app, 'Open311-test', TestStackProps.default.stackProps);
app.synth();
