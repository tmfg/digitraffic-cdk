import {loginUser} from "./cognito_backend";

const EFFECT_ALLOW = 'Allow';
const EFFECT_DENY = 'Deny';

export const handler = async function (event: any, context: any, callback: any) {
    console.log("event " + JSON.stringify(event));

    const group = getGroupFromPath(event.path);
    const password = event.queryStringParameters.password;
    const username = event.queryStringParameters.username;

    const policy = await generatePolicy(group, username, password, event.methodArn);

    console.log("policy " + JSON.stringify(policy));

    callback(null, policy);
}

function getGroupFromPath(path: string): string {
    return path.split('/')[2]; // images/[group]/[image]
}

async function generatePolicy(group: string, username: string, password: string, methodArn: string): Promise<any> {
    const authResponse = {} as any;

    try {
        const effect = await checkAuthorization(group, username, password);

        const policyDocument = {} as any;
        policyDocument.Version = '2012-10-17';
        policyDocument.Statement = [];

        const statementOne = {} as any;
        statementOne.Action = 'execute-api:Invoke';
        statementOne.Effect = effect;
        statementOne.Resource = methodArn;

        policyDocument.Statement[0] = statementOne;
        authResponse.policyDocument = policyDocument;

        return authResponse;
    } catch(error) {
        console.info("error " + JSON.stringify(error));
    }

}

async function checkAuthorization(group: string, username: string, password: string): Promise<string> {
    const user = await loginUser(username, password);

    if(user) {
        const userGroups = user.accessToken.payload["cognito:groups"] as string[];

        if (userGroups.includes(group)) {
            return EFFECT_ALLOW;
        }
    }

    return EFFECT_DENY;
}