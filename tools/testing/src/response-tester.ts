import type { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";

export function expectResponse(response: LambdaResponse, expectedStatus: number, expectedBody?: string): void {
    expect(response.status).toEqual(expectedStatus);

    if(expectedBody) {
        expect(Buffer.from(response.body, "base64").toString()).toEqual(expectedBody);
    }
}

export function expectResponseContent<T>(response: LambdaResponse, expectedStatus: number, checker: ((t: T) => void)): void {
    expect(response.status).toEqual(expectedStatus);

    const body = Buffer.from(response.body, "base64").toString();
    const content: T = JSON.parse(body) as T;

    checker(content);
}

export function expectNotFound(response: LambdaResponse, body: string = "Not found"): void {
    expectResponse(response, 404, body);
}