import { ProxyLambdaResponse } from "@digitraffic/common/dist/aws/types/proxytypes";

export function invalidRequest(): ProxyLambdaResponse {
    return { statusCode: 400, body: "Invalid request" };
}

export function serverError(): ProxyLambdaResponse {
    return { statusCode: 500, body: "Server error" };
}
