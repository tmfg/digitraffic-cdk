import {Construct, Stack, StackProps} from '@aws-cdk/core';
import {UserPool, UserPoolClient} from '@aws-cdk/aws-cognito';

import * as PublicApi from "./public-api";

export class UserManagementCdkStack extends Stack {
    constructor(scope: Construct, id: string, userManagementProps: any, props?: StackProps) {
        super(scope, id, props);

        const userPool = new UserPool(this, 'UserPool', {
            userPoolName: 'DigitrafficUserPool'
        });

        const userPoolClient = new UserPoolClient(this, 'UserPoolClient', {
            userPool: userPool,
            authFlows: {
                userPassword: true,
                userSrp: true
            },
            disableOAuth: true
        });

        PublicApi.create(this, userManagementProps, userPool.userPoolId, userPoolClient.userPoolClientId);
    }
}