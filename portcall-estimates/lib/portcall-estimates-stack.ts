import {Stack, Construct, StackProps} from '@aws-cdk/core';
import {Vpc, SecurityGroup} from '@aws-cdk/aws-ec2';
import * as InternalLambdas from './internal-lambdas';
import * as IntegrationApi from './integration-api';
import * as PublicApi from './public-api';
import * as Sqs from './sqs';
import {Props} from './app-props'

export class PortcallEstimatesStack extends Stack {
    constructor(scope: Construct, id: string, appProps: Props, props?: StackProps) {
        super(scope, id, props);

        const vpc = Vpc.fromVpcAttributes(this, 'vpc', {
            vpcId: appProps.vpcId,
            privateSubnetIds: appProps.privateSubnetIds,
            availabilityZones: appProps.availabilityZones
        });
        const lambdaDbSg = SecurityGroup.fromSecurityGroupId(this, 'LambdaDbSG', appProps.lambdaDbSgId);

        const queue = Sqs.createQueue(this);
        InternalLambdas.create(queue, vpc, lambdaDbSg, appProps, this);
        IntegrationApi.create(queue, vpc, lambdaDbSg, appProps, this);
        PublicApi.create(vpc, lambdaDbSg, appProps, this);
    }
}
