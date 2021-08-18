import {TestHttpServer, ListenProperties} from "../../lib/test/httpserver";

const http = require('http');

const PORT = 8091;

const DEFAULT_PROPS = {
    "/": () => ""
};

describe('db-areatraffic', () => {
    async function withServer(fn: ((server: TestHttpServer) => any), props: ListenProperties = DEFAULT_PROPS, statusCode = 200) {
        const server = new TestHttpServer();

        server.listen(PORT, props, false, statusCode);

        try {
            await fn(server);
        } finally {
            server.close();
        }
    }

    async function sendRequest(path = "/"): Promise<any> {
        let content = '';

        return await new Promise((resolve, reject) => {
            http.request({
                path,
                port: PORT,
                method: 'GET'
            }, (response: any) => {
                //another chunk of data has been received, so append it to `str`
                response.on('data', (chunk: any) => {
                    content += chunk;
                });

                //the whole response has been received, so we just print it out here
                response.on('end', () => {
                    resolve(response);
                });

                response.on('error', (error: any) => {
                    reject(error);
                });
            }).end();
        });
    }

    test('no calls', async () => {
        await withServer((server: TestHttpServer) => {
            expect(server.getCallCount()).toEqual(0);
        });
    });

    test('one call', async () => {
        await withServer(async (server: TestHttpServer) => {
            await sendRequest();

            expect(server.getCallCount()).toEqual(1);
        });
    });

    test('error 404', async () => {
        await withServer(async (server: TestHttpServer) => {
            const response = await sendRequest();

            expect(server.getCallCount()).toEqual(1);
            expect(response.statusCode).toEqual(404);
        }, DEFAULT_PROPS, 404);
    });

});
