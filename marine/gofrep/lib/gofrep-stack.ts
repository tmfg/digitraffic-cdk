import {Construct, Stack, StackProps} from '@aws-cdk/core';
import * as PublicApi from './public-api';
import {GofrepProps} from "./app-props";
import {Vpc} from '@aws-cdk/aws-ec2';

export class GofrepStack extends Stack {
    constructor(scope: Construct, id: string, appProps: GofrepProps, props?: StackProps) {
        super(scope, id, props);

        const vpc = Vpc.fromVpcAttributes(this, 'vpc', {
            vpcId: appProps.vpcId,
            privateSubnetIds: appProps.privateSubnetIds,
            availabilityZones: appProps.availabilityZones
        });

        PublicApi.create(this, vpc, appProps);
    }
}
