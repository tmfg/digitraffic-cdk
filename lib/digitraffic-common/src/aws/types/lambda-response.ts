import etag from "etag";

export class LambdaResponse {
    readonly status: number;
    readonly body: string;
    readonly fileName?: string;
    readonly timestamp?: string;
    readonly etag: string;

    constructor(status: number, body: string, fileName?: string, timestamp?: Date) {
        this.status = status;
        this.body = body;
        this.fileName = fileName;
        this.timestamp = timestamp?.toUTCString();
        this.etag = etag(body); // create strong etag by default
    }

    withTimestamp(timestamp: Date): LambdaResponse {
        return new LambdaResponse(this.status, this.body, this.fileName, timestamp);
    }

    /**
     * Create LambdaResponse for HTTP 200 from json.
     */
    static okJson<T>(json: T, fileName?: string): LambdaResponse {
        return this.ok(JSON.stringify(json), fileName);
    }

    /**
     * Create LambdaResponse for HTTP 200 from string.
     */
    static ok(body: string, fileName?: string): LambdaResponse {
        return this.okBinary(toBase64(body), fileName);
    }

    /**
     * Create LambdaResponse for HTTP 200 from base64-encoded data.
     */
    static okBinary(base64: string, fileName?: string): LambdaResponse {
        return this.createForBase64(200, base64, fileName);
    }

    /**
     * Create LambdaResponse for HTTP 400
     */
    static badRequest(body: string): LambdaResponse {
        return this.createForString(400, body);
    }

    /**
     * Create LambdaResponse for HTTP 404
     */
    static notFound(): LambdaResponse {
        return this.createForString(404, "Not found");
    }

    /**
     * Create LambdaResponse for HTTP 500
     */
    static internalError(): LambdaResponse {
        return this.createForString(500, "Internal error");
    }

    /**
     * Create LambdaResponse for HTTP 501
     */
    static notImplemented(): LambdaResponse {
        return this.createForString(501, "Not implemented");
    }

    private static createForString(status: number, body: string, fileName?: string): LambdaResponse {
        return this.createForBase64(status, toBase64(body), fileName);
    }

    private static createForBase64(status: number, base64Body: string, fileName?: string): LambdaResponse {
        return new LambdaResponse(status, base64Body, fileName);
    }
}

function toBase64(body: string): string {
    return Buffer.from(body).toString("base64");
}