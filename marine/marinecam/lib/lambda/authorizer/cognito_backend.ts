import {CognitoUserPool, CognitoUser, AuthenticationDetails, CognitoUserSession} from 'amazon-cognito-identity-js';
import {MarinecamEnvKeys} from "../../keys";

const POOL_DATA = {
    UserPoolId: process.env[MarinecamEnvKeys.USERPOOL_ID] as string,
    ClientId: process.env[MarinecamEnvKeys.POOLCLIENT_ID] as string,
};

const userPool = new CognitoUserPool(POOL_DATA);

function createCognitoUser(username: string) {
    const userData = {
        Username: username,
        Pool: userPool,
    };

    return new CognitoUser(userData);
}

export function loginUser(username: string, password: string): Promise<CognitoUserSession | null> {
    const authDetails = new AuthenticationDetails({
        Username: username,
        Password: password,
    });

    const cognitoUser = createCognitoUser(username);

    return new Promise(resolve => {
        try {
            cognitoUser.authenticateUser(authDetails, {
                onSuccess: (result: CognitoUserSession) => {
                    resolve(result);
                },

                onFailure: (result) => {
                    console.info("authenticateUser failed:" + JSON.stringify(result));

                    resolve(null);
                },

                newPasswordRequired: (userAttributes) => {
                    return changeUserPassword(cognitoUser, password, userAttributes);
                },
            });
        } catch (error) {
            console.info("error from authenticateUser:" + JSON.stringify(error));
        }
    });
}

function changeUserPassword(cognitoUser: CognitoUser, newPassword: string, userAttributes: object): Promise<CognitoUserSession | null> {
    return new Promise(resolve => {
        cognitoUser.completeNewPasswordChallenge(newPassword, userAttributes, {
            onSuccess: (result: CognitoUserSession) => {
                resolve(result);
            },
            onFailure: (result) => {
                console.info("passwordchallenge failed:" + JSON.stringify(result));

                resolve(null);
            },
        });
    });
}
