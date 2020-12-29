import {SecretsManager} from "aws-sdk";

const smClient = new SecretsManager({
    region: process.env.AWS_REGION
});

async function getSecret<T>(secretId: string): Promise<T> {
    const secretObj = await smClient.getSecretValue({
        SecretId: secretId
    }).promise();

    if (!secretObj.SecretString) {
        throw new Error('No secret found!');
    }

    return JSON.parse(secretObj.SecretString);
}

export async function withSecret<T>(secretId: string, fn: (secret: T) => any): Promise<void> {
    return fn(await getSecret(secretId));
}
