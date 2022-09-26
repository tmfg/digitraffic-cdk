export class LambdaResponse<T> {
    readonly status: number;
    readonly body: T;
    readonly fileName?: string;

    static ok<S>(body: S, fileName?: string) {
        return this.create(200, body, fileName);
    }

    static okJson<S>(json: S, fileName?: string) {
        return this.create(200, JSON.stringify(json, null, 2), fileName);
    }

    static badRequest(body: string) {
        return this.create(400, body);
    }

    static notFound() {
        return this.create(404, 'Not found');
    }

    static internalError() {
        return this.create(500, 'Internal error');
    }

    static notImplemented() {
        return this.create(501, 'Not implemented');
    }

    static create<S>(status: number, body: S, fileName?: string): Promise<LambdaResponse<S>> {
        return Promise.resolve({ status, body, fileName });
    }
}
