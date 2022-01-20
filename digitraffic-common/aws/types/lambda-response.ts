export class LambdaResponse<T> {
    readonly status: number;
    readonly body: T;
    readonly fileName?: string;

    static ok<T>(body: T, fileName?: string): LambdaResponse<T> {
        return this.create(200, body, fileName);
    }

    static badRequest(body: string): LambdaResponse<string> {
        return this.create(400, body);
    }

    static notFound(): LambdaResponse<string> {
        return this.create(404, 'Not found');
    }

    static internalError(): LambdaResponse<string> {
        return this.create(500, 'Internal error');
    }

    static create<T>(status: number, body: T, fileName?: string): LambdaResponse<T> {
        return { status, body, fileName };
    }
}