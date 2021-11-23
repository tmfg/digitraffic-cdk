export class LambdaResponse {
    readonly status: number;
    readonly body: any;

    static ok<T>(body: T): LambdaResponse {
        return this.create(200, body);
    }

    static bad_request(body: string): LambdaResponse {
        return this.create(400, body);
    }

    static not_found(): LambdaResponse {
        return this.create(404, 'Not found');
    }

    static internal_error(): LambdaResponse {
        return this.create(500, 'Internal error');
    }

    static create<T>(status: number, body: T): LambdaResponse {
        return { status, body };
    }
}