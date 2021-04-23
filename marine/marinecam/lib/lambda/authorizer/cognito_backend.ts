import {CognitoUserPool, CognitoUser, AuthenticationDetails} from 'amazon-cognito-identity-js';
import {MarinecamEnvKeys} from "../../keys";

const POOL_DATA = {
    UserPoolId: process.env[MarinecamEnvKeys.USERPOOL_ID] as string,
    ClientId: process.env[MarinecamEnvKeys.POOLCLIENT_ID] as string
};

const userPool = new CognitoUserPool(POOL_DATA);

function createCognitoUser(username: string) {
    const userData = {
        Username: username,
        Pool: userPool
    };

    return new CognitoUser(userData);
}

export async function loginUser(username: string, password: string): Promise<any> {
    const authDetails = new AuthenticationDetails({
        Username: username,
        Password: password
    });

    const cognitoUser = createCognitoUser(username);

    return new Promise(resolve => {
        try {
            cognitoUser.authenticateUser(authDetails, {
                onSuccess: (result: any) => {
                    resolve(result);
                },

                onFailure: (result: any) => {
                    console.info("authenticateUser failed:" + JSON.stringify(result));

                    resolve(null);
                },

                newPasswordRequired: async (userAttributes: any, requiredAttributes: any) => {
                    return await changeUserPassword(cognitoUser, password, userAttributes);
                }
            });
        } catch(error) {
            console.info("error from authenticateUser:" + JSON.stringify(error));
        }
    });
}

async function changeUserPassword(cognitoUser: any, newPassword: string, userAttributes: any): Promise<any> {
    return new Promise(resolve => {
        cognitoUser.completeNewPasswordChallenge(newPassword, userAttributes, {
            onSuccess: (result: any) => {
                resolve(result);
            },
            onFailure: (result: any) => {
                console.info("passwordchallenge failed:" + JSON.stringify(result));

                resolve(null);
            }
        });
    });
}
