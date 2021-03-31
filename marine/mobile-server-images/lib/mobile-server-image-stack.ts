import {Stack, Construct, StackProps} from '@aws-cdk/core';
import {Vpc, SecurityGroup} from '@aws-cdk/aws-ec2';
import {Secret} from "@aws-cdk/aws-secretsmanager";
import {MobileServerProps} from './app-props';
import * as InternalLambas from './internal-lambdas';
import * as PublicApi from './public-api';

export class MobileServerImageStack extends Stack {
    constructor(scope: Construct, id: string, appProps: MobileServerProps, props?: StackProps) {
        super(scope, id, props);

        const secret = Secret.fromSecretNameV2(this, 'MobileServiceSecret', appProps.secretId);

        const vpc = Vpc.fromVpcAttributes(this, 'vpc', {
            vpcId: appProps.vpcId,
            privateSubnetIds: appProps.privateSubnetIds,
            availabilityZones: appProps.availabilityZones
        });

        const lambdaDbSg = SecurityGroup.fromSecurityGroupId(this, 'LambdaDbSG', appProps.lambdaDbSgId);

        InternalLambas.create(secret, vpc, lambdaDbSg, appProps, this);
        PublicApi.create(secret, vpc, lambdaDbSg, appProps, this);
    }
}