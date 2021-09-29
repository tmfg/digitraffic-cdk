import {Construct, Stack, StackProps} from "@aws-cdk/core";
import {SecurityGroup, Vpc} from "@aws-cdk/aws-ec2";
import {InternalLambdas} from "./internal-lambdas";
import {Secret} from "@aws-cdk/aws-secretsmanager";
import {AppProps} from "./app-props";
import {Canaries} from "./canaries";

export class CountingSitesCdkStack extends Stack {
    constructor(scope: Construct, id: string, appProps: AppProps, props?: StackProps) {
        super(scope, id, props);

        const secret = Secret.fromSecretNameV2(this, 'CountingSitesSecret', appProps.secretId);

        // VPC reference construction requires vpcId and availability zones
        // private subnets are used in Lambda configuration
        const vpc = Vpc.fromVpcAttributes(this, 'vpc', {
            vpcId: appProps.vpcId,
            privateSubnetIds: appProps.privateSubnetIds,
            availabilityZones: appProps.availabilityZones
        });
        // security group that allows Lambda database access
        const lambdaDbSg = SecurityGroup.fromSecurityGroupId(this, 'LambdaDbSG', appProps.lambdaDbSgId);

        // 'this' reference must be passed to all child resources to keep them tied to this stack
        new InternalLambdas(this, vpc, lambdaDbSg, appProps, secret);
        //PublicApi.create(vpc, lambdaDbSg, lambdaProps, this);

        new Canaries(this, secret, vpc, lambdaDbSg, appProps);
    }
}
