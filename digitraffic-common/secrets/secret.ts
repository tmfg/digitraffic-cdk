import {SecretsManager} from 'aws-sdk';
import {SecretToPromiseFunction} from "./dbsecret";

const smClient = new SecretsManager({
    region: process.env.AWS_REGION
});

export type GenericSecret = Record<string, string>;

export async function withSecret<Secret, Response>(secretId: string, fn: SecretToPromiseFunction<Secret, Response>): Promise<Response> {
    return fn(await getSecret(secretId));
}

export async function getSecret<Response>(secretId: string, prefix = ''): Promise<Response> {
    const secretObj = await smClient.getSecretValue({
        SecretId: secretId
    }).promise();

    if (!secretObj.SecretString) {
        throw new Error('No secret found!');
    }

    const secret = JSON.parse(secretObj.SecretString);

    if(prefix === '') {
        return secret;
    }

    return parseSecret(secret, `${prefix}.`);
}

function parseSecret<Secret>(secret: GenericSecret, prefix: string): Secret {
    const parsed: Record<string, string> = {};
    const skip = prefix.length;

    for(const key in secret) {
        if(key.startsWith(prefix)) {
            parsed[key.substring(skip)] = secret[key] as string;
        }
    }

    return parsed as unknown as Secret;
}

export async function withSecretAndPrefix<Secret, Response>(secretId: string, prefix: string, fn: SecretToPromiseFunction<Secret, Response>): Promise<Response> {
    return fn(await getSecret(secretId, prefix));
}
