import {
    CognitoUserPool,
    CognitoUser,
    AuthenticationDetails,
    CognitoUserSession
} from "amazon-cognito-identity-js";
import { MarinecamEnvKeys } from "../../keys";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

const POOL_DATA = {
    UserPoolId: getEnvVariable(MarinecamEnvKeys.USERPOOL_ID),
    ClientId: getEnvVariable(MarinecamEnvKeys.POOLCLIENT_ID)
};

const userPool = new CognitoUserPool(POOL_DATA);

function createCognitoUser(username: string) {
    const userData = {
        Username: username,
        Pool: userPool
    };

    return new CognitoUser(userData);
}

export function loginUser(username: string, password: string): Promise<CognitoUserSession | null> {
    const authDetails = new AuthenticationDetails({
        Username: username,
        Password: password
    });

    const cognitoUser = createCognitoUser(username);

    return new Promise((resolve) => {
        try {
            cognitoUser.authenticateUser(authDetails, {
                onSuccess: (result: CognitoUserSession) => {
                    resolve(result);
                },

                onFailure: (result) => {
                    logger.info({
                        method: "CognitoBackend.loginUser",
                        message: "authenticateUser failed",
                        customDetails: JSON.stringify(result)
                    });

                    resolve(null);
                },

                newPasswordRequired: (userAttributes: object) => {
                    return changeUserPassword(cognitoUser, password, userAttributes);
                }
            });
        } catch (error) {
            logger.error({
                method: "CognitoBackend.loginUser",
                message: "authenticateUser failed",
                customDetails: JSON.stringify(error)
            });
        }
    });
}

function changeUserPassword(cognitoUser: CognitoUser, newPassword: string, userAttributes: object) {
    cognitoUser.completeNewPasswordChallenge(newPassword, userAttributes, {
        onSuccess: (result) => {
            logger.info({
                method: "CognitoBackend.changeUserPassword",
                message: "success",
                customDetails: JSON.stringify(result)
            });
        },
        onFailure: (result) => {
            logger.info({
                method: "CognitoBackend.changeUserPassword",
                message: "failure",
                customDetails: JSON.stringify(result)
            });
        }
    });
}
