import {SecretsManager} from 'aws-sdk';

const smClient = new SecretsManager({
    region: process.env.AWS_REGION
});

export type GenericSecret = Record<string, string>;

export async function withSecret<T>(secretId: string, fn: (secret: T) => any): Promise<void> {
    return fn(await getSecret(secretId));
}

export async function getSecret<T>(secretId: string, prefix = ''): Promise<T> {
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

function parseSecret<T>(secret: GenericSecret, prefix: string): T {
    const parsed: any = {};
    const skip = prefix.length;

    for(const key in secret) {
        if(key.startsWith(prefix)) {
            parsed[key.substring(skip)] = secret[key] as string;
        }
    }

    return parsed;
}

export async function withSecretAndPrefix<T>(secretId: string, prefix: string, fn: (secret: T) => any): Promise<void> {
    return fn(await getSecret(secretId, prefix));
}
