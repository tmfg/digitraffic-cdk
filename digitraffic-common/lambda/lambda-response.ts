export class LambdaResponse {
    readonly status: number;
    readonly body: string;

    static ok(body: string): LambdaResponse {
        return this.create(200, body);
    }

    static bad_request(body: string): LambdaResponse {
        return this.create(400, body);
    }

    static internal_error(body: string): LambdaResponse {
        return this.create(500, body);
    }

    static create(status: number, body: string): LambdaResponse {
        return { status, body };
    }
}