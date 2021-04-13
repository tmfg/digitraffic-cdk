import {Stack, Construct, StackProps} from '@aws-cdk/core';
import {Vpc, SecurityGroup} from '@aws-cdk/aws-ec2';
import * as IntegrationApi from './integration-api';
import {VoyagePlanGatewayProps} from "./app-props";
import {Topic} from "@aws-cdk/aws-sns";
import {Secret} from "@aws-cdk/aws-secretsmanager";

export class VoyagePlanGatewayStack extends Stack {
    constructor(scope: Construct, id: string, appProps: VoyagePlanGatewayProps, props?: StackProps) {
        super(scope, id, props);

        const secret = Secret.fromSecretNameV2(this, 'VPGWSecret', appProps.secretId);

        const vpc = Vpc.fromVpcAttributes(this, 'vpc', {
            vpcId: appProps.vpcId,
            privateSubnetIds: appProps.privateSubnetIds,
            availabilityZones: appProps.availabilityZones
        });

        IntegrationApi.create(secret, vpc, appProps, this);
    }
}
