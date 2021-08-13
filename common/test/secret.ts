export async function withMockSecret<T>(secretId: string, fn: (secret: any) => T, secret = {}): Promise<T> {
    return fn(secret);
}
