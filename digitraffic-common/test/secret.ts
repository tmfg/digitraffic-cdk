export function createSecretFunction<T>(secret: any) {
    return async (secretId: string, fn: (s: any) => T) => {
        return fn(secret);
    }
}
