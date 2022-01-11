import {BlockPublicAccess, Bucket} from "aws-cdk-lib/aws-s3";
import {UserPool, UserPoolClient} from "aws-cdk-lib/aws-cognito";
import {Construct} from "constructs";
import {DigitrafficStack} from "digitraffic-common/aws/infra/stack/stack";
import {MobileServerProps} from './app-props';
import * as InternalLambas from './internal-lambdas';
import {PrivateApi} from "./private-api";
import {Canaries} from "./canaries";

export class MarinecamStack extends DigitrafficStack {
    constructor(scope: Construct, id: string, configuration: MobileServerProps) {
        super(scope, id, configuration);

        const bucket = createImageBucket(this, configuration);
        const [userPool, userPoolClient] = createUserPool(this);

        InternalLambas.create(this, bucket);
        const privateApi = new PrivateApi(this, bucket, userPool, userPoolClient);

        new Canaries(this, privateApi.publicApi);
    }
}

function createUserPool(stack: Construct): [UserPool, UserPoolClient] {
    const userPool = new UserPool(stack, 'UserPool', {
        userPoolName: 'MarinecamUserPool',
    });

    const userPoolClient = new UserPoolClient(stack, 'UserPoolClient', {
        userPool,
        authFlows: {
            userPassword: true,
            userSrp: true,
        },
        disableOAuth: true,
    });

    return [userPool, userPoolClient];
}

function createImageBucket(stack: Construct, props: MobileServerProps): Bucket {
    return new Bucket(stack, 'MarinecamBucket', {
        bucketName: `dt-marinecam-${props.production ? 'prod' : 'test'}`,
        versioned: false,
        publicReadAccess: false,
        blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    });
}
