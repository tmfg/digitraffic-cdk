const EFFECT_ALLOW = 'Allow';
const EFFECT_DENY = 'Deny';

export const handler = async function (event: any, context: any, callback: any) {
    console.info("got event " + JSON.stringify(event, null, 2));
//    const [username, password] = parseAuthentication(event.headers.authorization, callback);
//    const group = getGroupFromPath(event.path);

    const policy = await generatePolicy(event.methodArn);

    console.log("policy " + JSON.stringify(policy));

    callback(null, policy);
}

async function generatePolicy(methodArn: string): Promise<any> {
    const authResponse = {} as any;

    const effect = EFFECT_ALLOW;

    const policyDocument = {} as any;
    policyDocument.Version = '2012-10-17';
    policyDocument.Statement = [];

    const statementOne = {} as any;
    statementOne.Action = 'execute-api:Invoke';
    statementOne.Effect = effect;
    statementOne.Resource = methodArn;

    const context = {} as any;
    //context.mrn = 'generate MRN';

    policyDocument.Statement[0] = statementOne;
    authResponse.policyDocument = policyDocument;
    //authResponse.context = context;

    return authResponse;
}
