import {Construct, Stack, StackProps} from '@aws-cdk/core';
import {UserPool, UserPoolClient} from '@aws-cdk/aws-cognito';

export class UserManagementCdkStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        this.createCognito(this);
    }

    createCognito(stack: Construct) {
        const userPool = new UserPool(stack, 'UserPool', {
            userPoolName: 'DigitrafficUserPool'
        });

        const userPoolClient = new UserPoolClient(stack, 'UserPoolClient', {
            userPool: userPool,
            authFlows: {
                userPassword: true
            },
            disableOAuth: true
        });
    }
}