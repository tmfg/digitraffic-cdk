import type { CloudFrontHeaders, CloudFrontRequest, CloudFrontRequestEvent, CloudFrontRequestHandler, Context } from "aws-lambda";
import { jest } from "@jest/globals";

export type MockedRequest = jest.MockedFunction<(...args: unknown[]) => unknown>;

export async function requestHandlerCall(handler: CloudFrontRequestHandler, request: Partial<CloudFrontRequest>): Promise<MockedRequest> {
    const context = {} as unknown as Context;
    const callback = jest.fn();
    const event = {
        Records: [{ cf: {
            request
        } }]
    } as unknown as CloudFrontRequestEvent;

    await handler(event, context, callback);

    return callback;
}

export function createHeader(key: string, value: string): CloudFrontHeaders {
    return {
        [key]: [{ key, value }]
    };    
}

export function headersWithAcceptEncoding(value: string): CloudFrontHeaders {
    return createHeader("accept-encoding", value);
}

export interface ExpectedRequest {
    readonly method: string
    readonly uri?: string
    readonly origin?: boolean
    readonly headers?: Record<string, string | false>
}

export function expectRequest(cb: MockedRequest, expected: ExpectedRequest): void {
    expect(cb).toHaveBeenCalledTimes(1);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(cb.mock.calls[0][1].method).toEqual(expected.method);    

    if(expected.uri) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(cb.mock.calls[0][1].uri).toEqual(expected.uri);
    }
    if(expected.origin !== undefined && expected.origin === false) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(cb.mock.calls[0][1].origin).not.toBeDefined();
    }
    if(expected.origin !== undefined && expected.origin === true) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(cb.mock.calls[0][1].origin).toBeDefined();
    }

    if(expected.headers) {
        Object.entries(expected.headers).forEach(([header, expected]) => {
            if(expected) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                expect(cb.mock.calls[0][1].headers[header.toLowerCase()]).toEqual(createHeader(header, expected)[header]);
            } else {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                expect(cb.mock.calls[0][1].headers[header.toLowerCase()]).not.toBeDefined();
            }
        });
    }    
}