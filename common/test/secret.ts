export async function withMockSecret<T>(secretId: string, fn: (secret: any) => T): Promise<T> {
    return fn({});
}

export function createSecretFunction<T>(secret: any) {
    return async (secretId: string, fn: (s: any) => T) => {
        return fn(secret);
    }
}
