import {Construct} from '@aws-cdk/core';
import {Secret} from "@aws-cdk/aws-secretsmanager";
import {MobileServerProps} from './app-props';
import * as InternalLambas from './internal-lambdas';
import * as PublicApi from './public-api';
import {BlockPublicAccess, Bucket} from "@aws-cdk/aws-s3";
import {UserPool, UserPoolClient} from "@aws-cdk/aws-cognito";
import {DigitrafficStack} from "digitraffic-common/stack/stack";

export class MarinecamStack extends DigitrafficStack {
    constructor(scope: Construct, id: string, configuration: MobileServerProps) {
        super(scope, id, configuration);

        const secret = Secret.fromSecretNameV2(this, 'MobileServiceSecret', configuration.secretId);

        const bucket = createImageBucket(this, configuration);
        const [userPool, userPoolClient] = createUserPool(this);

        InternalLambas.create(this, secret, bucket);
        PublicApi.create(this, secret, bucket, userPool, userPoolClient);
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
