import {loginUser} from "./cognito_backend";

const EFFECT_ALLOW = 'Allow';
const EFFECT_DENY = 'Deny';

const KEY_COGNITO_GROUPS = "cognito:groups";

export const handler = async function (event: any, context: any, callback: any) {
    console.log("event " + JSON.stringify(event));

    const [username, password] = parseAuthentication(event.headers.authorization, callback);
    const group = getGroupFromPath(event.path);

    const policy = await generatePolicy(group, username, password, event.methodArn);

    console.log("policy " + JSON.stringify(policy));

    callback(null, policy);
}

function parseAuthentication(authorizationHeader: string, callback: any): [string, string] {
    console.info("header " + authorizationHeader);

    if(!authorizationHeader) return callback('Unauthorized');

    const encodedCreds = authorizationHeader.split(' ')[1];
    const plainCreds = Buffer.from(encodedCreds, 'base64').toString().split(':');

    return [plainCreds[0], plainCreds[1]];
}

function getGroupFromPath(path: string): string {
    return path.split('/')[2]; // images/[group]/[image]
}

async function generatePolicy(group: string, username: string, password: string, methodArn: string): Promise<any> {
    const authResponse = {} as any;

    try {
        const user = await loginUser(username, password);
        const effect = await checkAuthorization(user, group);

        const policyDocument = {} as any;
        policyDocument.Version = '2012-10-17';
        policyDocument.Statement = [];

        const statementOne = {} as any;
        statementOne.Action = 'execute-api:Invoke';
        statementOne.Effect = effect;
        statementOne.Resource = methodArn;

        const context = {} as any;
        context.groups = JSON.stringify(user.accessToken.payload[KEY_COGNITO_GROUPS]);

        policyDocument.Statement[0] = statementOne;
        authResponse.policyDocument = policyDocument;
        authResponse.context = context;

        return authResponse;
    } catch(error) {
        console.info("error " + JSON.stringify(error));
    }

}

async function checkAuthorization(user: any, group: string): Promise<string> {
    if(user) {
        console.info("checking group " + group);

        const userGroups = user.accessToken.payload[KEY_COGNITO_GROUPS] as string[];

        if (userGroups.includes(group) || group == 'metadata') {
            return EFFECT_ALLOW;
        }
    }

    return EFFECT_DENY;
}