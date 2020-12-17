import {AUTHORIZATION_FAILED_MESSAGE} from "../../../common/api/errors";

const AmazonCognitoIdentity = require('amazon-cognito-identity-js');

const POOL_DATA = {
    UserPoolId: process.env.USERPOOL_ID,
    ClientId: process.env.CLIENT_ID
};

const AUTH_FAILED_CREDS = JSON.stringify({
    "error" : AUTHORIZATION_FAILED_MESSAGE,
    "errorMessage" : "Authenticate with credentials"
});

const AUTH_FAILED_CHANGE_PASSWORD = JSON.stringify({
    "error" : AUTHORIZATION_FAILED_MESSAGE,
    "errorMessage" : "Change your password"
});

const userPool = new AmazonCognitoIdentity.CognitoUserPool(POOL_DATA);

export const login_handler = async (event: any, context: any, callback: any): Promise<any> => {
    return await loginUser(event.username, event.password, event.newPassword);
};

function createCognitoUser(username: string) {
    const userData = {
        Username: username,
        Pool: userPool
    };

    return new AmazonCognitoIdentity.CognitoUser(userData);
}

function loginUser(username: string, password: string, newPassword?: string): Promise<any> {
    const authDetails = new AmazonCognitoIdentity.AuthenticationDetails({
        Username: username,
        Password: password
    });

    const cognitoUser = createCognitoUser(username);

    return new Promise(((resolve, reject) => {
        cognitoUser.authenticateUser(authDetails, {
            onSuccess: (result: any) => {
                console.info("success " + JSON.stringify(result));

                resolve(result);
            },

            onFailure: (result: any) => {
                console.info("failure " + JSON.stringify(result));

                reject(AUTH_FAILED_CREDS);
            },

            newPasswordRequired: async (userAttributes: any, requiredAttributes: any) => {
                console.info("new password required " + JSON.stringify(userAttributes));

                if (newPassword) {
                    return await changeUserPassword(cognitoUser, newPassword, userAttributes);
                } else {
                    reject(AUTH_FAILED_CHANGE_PASSWORD);
                }
            }
        });
    }));
}

async function changeUserPassword(cognitoUser: any, newPassword: string, userAttributes: any): Promise<any> {
    return new Promise(((resolve, reject) => {
        cognitoUser.completeNewPasswordChallenge(newPassword, userAttributes, {
            onSuccess: (result: any) => {
                console.info("password changed " + JSON.stringify(result));

                resolve(result);
            },
            onFailure: (result: any) => {
                console.info("failed " + JSON.stringify(result));

                reject(AUTH_FAILED_CREDS);
            },
            newPasswordRequired: (result: any) => {
                console.info("newPasswordRequired:" + JSON.stringify(result));

                reject(AUTH_FAILED_CREDS);
            }
        });
    }));
}

