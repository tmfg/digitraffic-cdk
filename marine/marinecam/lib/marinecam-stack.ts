import {Stack, Construct, StackProps} from '@aws-cdk/core';
import {Vpc, SecurityGroup} from '@aws-cdk/aws-ec2';
import {Secret} from "@aws-cdk/aws-secretsmanager";
import {MobileServerProps} from './app-props';
import * as InternalLambas from './internal-lambdas';
import * as PublicApi from './public-api';
import {BlockPublicAccess, Bucket} from "@aws-cdk/aws-s3";
import {UserPool, UserPoolClient} from "@aws-cdk/aws-cognito";

export class MarinecamStack extends Stack {
    constructor(scope: Construct, id: string, appProps: MobileServerProps, props?: StackProps) {
        super(scope, id, props);

        const secret = Secret.fromSecretNameV2(this, 'MobileServiceSecret', appProps.secretId);

        const vpc = Vpc.fromVpcAttributes(this, 'vpc', {
            vpcId: appProps.vpcId,
            privateSubnetIds: appProps.privateSubnetIds,
            availabilityZones: appProps.availabilityZones
        });

        const lambdaDbSg = SecurityGroup.fromSecurityGroupId(this, 'LambdaDbSG', appProps.lambdaDbSgId);

        const bucket = createImageBucket(this, appProps);
        const [userPool, userPoolClient] = createUserPool(this);

        InternalLambas.create(secret, vpc, lambdaDbSg, appProps, bucket, this);
        PublicApi.create(secret, vpc, lambdaDbSg, appProps, bucket, userPool, userPoolClient, this);
    }
}

function createUserPool(stack: Construct): [UserPool, UserPoolClient] {
    const userPool = new UserPool(stack, 'UserPool', {
        userPoolName: 'MarinecamUserPool'
    });

    const userPoolClient = new UserPoolClient(stack, 'UserPoolClient', {
        userPool,
        authFlows: {
            userPassword: true,
            userSrp: true
        },
        disableOAuth: true
    });

    return [userPool, userPoolClient];
}

function createImageBucket(stack: Construct, props: MobileServerProps): Bucket {
    return new Bucket(stack, 'MarinecamBucket', {
        bucketName: `dt-marinecam-${props.env}`,
        versioned: false,
        publicReadAccess: false,
        blockPublicAccess: BlockPublicAccess.BLOCK_ALL
    });
}
