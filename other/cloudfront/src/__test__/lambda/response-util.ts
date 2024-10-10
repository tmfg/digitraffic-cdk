import type { CloudFrontRequest, CloudFrontResponse, CloudFrontResponseEvent, CloudFrontResponseHandler, CloudFrontResultResponse, Context } from "aws-lambda";
import { jest } from "@jest/globals";
import { createHeader } from "./request-util.js";
import { AC_HEADERS } from "../../lambda-util.js";

type MockedResponse = jest.MockedFunction<(...args: unknown[]) => unknown>;

export async function responseHandlerCall(handler: CloudFrontResponseHandler, request: Partial<CloudFrontRequest>, response: Partial<CloudFrontResponse>): Promise<MockedResponse> {
    const context = {} as unknown as Context;
    const callback = jest.fn();
    const event = {
        Records: [{ cf: {
            request, response
        } }]
    } as unknown as CloudFrontResponseEvent;

    await handler(event, context, callback);

    return callback;
}

export interface ExpectedResponse {
    readonly response?: CloudFrontResultResponse;
    readonly status?: string
    readonly headers?: Record<string, string | false>
}

export function expectResponse(cb: MockedResponse, expected: ExpectedResponse): void {
    expect(cb).toHaveBeenCalledTimes(1);

    if(expected.response) {
         // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(cb.mock.calls[0][1]).toEqual(expected.response);        
    } else {    
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(cb.mock.calls[0][1].method).not.toBeDefined();

        if(expected.status) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            expect(cb.mock.calls[0][1].status).toEqual(expected.status);
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
}

export function expectResponseHeader(cb: MockedResponse, headerName: string, expected: string | false): void {
    expect(cb).toHaveBeenCalledTimes(1);

    if(expected) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(cb.mock.calls[0][1].headers[headerName.toLowerCase()]).toEqual(createHeader(headerName, expected)[headerName]);
    } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(cb.mock.calls[0][1].headers[headerName.toLowerCase()]).not.toBeDefined();
    }
}

export function expectResponseCorsHeaders(cb: MockedResponse, shouldContain: boolean = true): void {
    if(shouldContain) {
        expectResponseHeader(cb, AC_HEADERS.ALLOW_ORIGIN, "*");
    } else {
        expectResponseHeader(cb, AC_HEADERS.ALLOW_ORIGIN, false);
    }
}