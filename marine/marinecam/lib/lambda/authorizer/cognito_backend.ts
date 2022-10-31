import {
    CognitoUserPool,
    CognitoUser,
    AuthenticationDetails,
    CognitoUserSession,
} from "amazon-cognito-identity-js";
import { MarinecamEnvKeys } from "../../keys";
import { envValue } from "@digitraffic/common/dist/aws/runtime/environment";

const POOL_DATA = {
    UserPoolId: envValue(MarinecamEnvKeys.USERPOOL_ID),
    ClientId: envValue(MarinecamEnvKeys.POOLCLIENT_ID),
};

const userPool = new CognitoUserPool(POOL_DATA);

function createCognitoUser(username: string) {
    const userData = {
        Username: username,
        Pool: userPool,
    };

    return new CognitoUser(userData);
}

export function loginUser(
    username: string,
    password: string
): Promise<CognitoUserSession | null> {
    const authDetails = new AuthenticationDetails({
        Username: username,
        Password: password,
    });

    const cognitoUser = createCognitoUser(username);

    return new Promise((resolve) => {
        try {
            cognitoUser.authenticateUser(authDetails, {
                onSuccess: (result: CognitoUserSession) => {
                    resolve(result);
                },

                onFailure: (result) => {
                    console.info(
                        "authenticateUser failed:" + JSON.stringify(result)
                    );

                    resolve(null);
                },

                newPasswordRequired: (userAttributes: object) => {
                    return changeUserPassword(
                        cognitoUser,
                        password,
                        userAttributes
                    );
                },
            });
        } catch (error) {
            console.info(
                "error from authenticateUser:" + JSON.stringify(error)
            );
        }
    });
}

function changeUserPassword(
    cognitoUser: CognitoUser,
    newPassword: string,
    userAttributes: object
) {
    cognitoUser.completeNewPasswordChallenge(newPassword, userAttributes, {
        onSuccess: (result) => {
            console.info(
                "passwordchallenge success: %s",
                JSON.stringify(result)
            );
        },
        onFailure: (result) => {
            console.info(
                "passwordchallenge failed: %s",
                JSON.stringify(result)
            );
        },
    });
}
