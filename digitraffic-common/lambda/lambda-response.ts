export class LambdaResponse {
    readonly status: number;
    readonly body: string;

    static ok(body: any): LambdaResponse {
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

    static create(status: number, body: any): LambdaResponse {
        return { status, body };
    }
}