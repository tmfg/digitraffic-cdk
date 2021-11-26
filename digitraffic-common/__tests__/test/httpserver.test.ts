import {TestHttpServer, ListenProperties, ERROR_NO_MATCH, ERRORCODE_NOT_FOUND} from "../../test/httpserver";
import {IncomingMessage} from "http";
import http = require('http');

const DEFAULT_PATH = "/";
const PORT = 8091;

const DEFAULT_PROPS = {
    "/": () => ""
};

describe('TestHttpServer - test', () => {
    async function withServer(fn: ((server: TestHttpServer) => void), props: ListenProperties = DEFAULT_PROPS, statusCode = 200) {
        const server = new TestHttpServer();

        server.listen(PORT, props, false, statusCode);

        try {
            await fn(server);
        } finally {
            server.close();
        }
    }

    async function sendGetRequest(path = DEFAULT_PATH): Promise<IncomingMessage> {
        return sendRequest("GET", path);
    }

    async function sendPostRequest(path = DEFAULT_PATH, body: string): Promise<IncomingMessage> {
        return sendRequest("POST", path, body);
    }

    async function sendRequest(method: string, path: string, body?: string): Promise<IncomingMessage> {
        return new Promise((resolve, reject) => {
            const request = http.request({
                path,
                port: PORT,
                method
            }, (response: IncomingMessage) => {
                response.on('data', () => {
                    // do nothing
                });

                //the whole response has been received, so we just print it out here
                response.on('end', () => {
                    resolve(response);
                });

                response.on('error', (error: Error) => {
                    reject(error);
                });
            });

            if(method === "POST") {
                request.write(body);
            }
            request.end();
        });
    }

    test('no calls', async () => {
        await withServer((server: TestHttpServer) => {
            expect(server.getCallCount()).toEqual(0);
        });
    });

    test('one get', async () => {
        await withServer(async (server: TestHttpServer) => {
            await sendGetRequest();

            expect(server.getCallCount()).toEqual(1);
        });
    });

    test('one get - no MATCH', async () => {
        await withServer(async (server: TestHttpServer) => {
            const response = await sendGetRequest("/no-match");

            expect(server.getCallCount()).toEqual(1);
            expect(server.getRequestBody(0)).toEqual(ERROR_NO_MATCH);
            expect(response.statusCode).toEqual(ERRORCODE_NOT_FOUND);
        });
    });

    test('get - error 405', async () => {
        const ERROR_CODE = 405;

        await withServer(async (server: TestHttpServer) => {
            const response = await sendGetRequest();

            expect(server.getCallCount()).toEqual(1);
            expect(response.statusCode).toEqual(ERROR_CODE);
        }, DEFAULT_PROPS, ERROR_CODE);
    });

    test('one post', async () => {
        await withServer(async (server: TestHttpServer) => {
            const testBody = "Testing123!";
            await sendPostRequest(DEFAULT_PATH, testBody);

            expect(server.getCallCount()).toEqual(1);
            expect(server.getRequestBody(0)).toEqual(testBody);
        });
    });

});
