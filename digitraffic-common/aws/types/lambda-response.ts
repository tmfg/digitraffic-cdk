export class LambdaResponse<T> {
    readonly status: number;
    readonly body: T;

    static ok<T>(body: T): LambdaResponse<T> {
        return this.create(200, body);
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

    static create<T>(status: number, body: T): LambdaResponse<T> {
        return { status, body };
    }
}