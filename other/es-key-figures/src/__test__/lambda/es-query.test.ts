//import * as http from "http";
//import * as AWSx from "aws-sdk";
//import * as esQuery from "../../lambda/es-query";
//import type { IncomingMessage } from "http";
//import * as AWSx from "aws-sdk";
//const AWS = AWSx as any;

/*type IncomingMessageMock = jest.Mock<IncomingMessage> & {
    statusCode: number;
}*/

/*jest.mock("http");
const http = require("http");*/

//function IncomingMessageMock(code) {
/*const mockRaw: Record<string, any> = jest.fn();
    mockRaw.statusCode = code;
    return mockRaw as IncomingMessageMock;*/
//    this.statusCode = code;
//}

//IncomingMessageMock.prototype = http.IncomingMessage.prototype;

//http.IncomingMessage = IncomingMessageMock;

import { mock } from "sinon";

const nock = require("nock");
/*jest.mock("aws-sdk");
const AWS = require("aws-sdk");*/

/*const NodeHttpClientMock = (function () {
    let nextIncomingMessage = jest.fn(() => {
        const mock: IncomingMessage = new IncomingMessageMock(200);
        mock.socket.write('{"foo":"bar"}');
        return mock;
    });

    const foo = function () {
        this.handleRequest = jest.fn((req, som, callback, errCallback) => {
            const incomingMessage = nextIncomingMessage();
            callback(incomingMessage);
        });
    };

    foo.mockIncomingStatusCodeOnce = function (code: number) {
        nextIncomingMessage.mockImplementationOnce(() => {
            const mock: IncomingMessage = new IncomingMessageMock(code);
            mock.socket.write('{"foo":"bar"}');
            return mock;
        });
        return foo;
    };

    return foo;
})();

function HttpRequestMock(endpoint) {
    this.headers = {};
}

NodeHttpClientMock.prototype = AWS.NodeHttpClient.prototype;

HttpRequestMock.prototype = AWS.HttpRequest.prototype;

AWS.NodeHttpClient = NodeHttpClientMock;

AWS.HttpRequest = HttpRequestMock;*/

/*jest.mock('aws-sdk', () => {
    const originalModule = jest.requireMock('aws-sdk');
    let responseCode = 200;
    const mockClient = jest.fn(() => {
        return {
            handleRequest: jest.fn((req, som, callback, errCallback) => {
                const incomingMessage = new IncomingMessageMock(200);
                callback(incomingMessage)
            })
        };
    })();
    return {
        __esModule: true,
        ...originalModule,
        NodeHTTPClient: jest.fn(() => {
            return mockClient;
        }),
        mockIncomingStatusCodeOnce: (code: number) => {
            return mockClient.handleRequest.mockImplementationOnce((req, som, callback, errCallback) => {
                const incomingMessage = new IncomingMessageMock(code);
                callback(incomingMessage);
            })
        }
    };
});*/

/*jest.mock('../../lambda/es-query', () => {
    const originalModule = jest.requireActual('../../lambda/es-query');
    const foo = jest.spyOn(originalModule, "handleRequest");
    let jotain = {
        __esModule: true,
        ...originalModule,
        handleRequest: foo,
        bar: foo,
//        addCredentialsToEsRequest: jest.fn((req) => {}),
//        createRequestForEs: jest.fn((endpoint, query, path) => new AWS.HttpRequest(endpoint)),
    }
    const baz = jest.spyOn(jotain, "fetchDataFromEs");
    jotain.fetchDataFromEs = baz;
    return jotain;
});*/

//AWS.Signers = jest.fn();
function V4() {
    this.addAuthorization = jest.fn((req, credentials) => {});
}
jest.mock("aws-sdk", () => {
    const originalModule = jest.requireActual("aws-sdk");
    const mockSigner = function Signer() {};
    mockSigner.V4 = V4;
    return {
        __esModule: true,
        ...originalModule,
        Signers: mockSigner
    };
});

// @ts-ignore
const AWS = require("aws-sdk");

const esQuery = require("../../lambda/es-query");

test("fetchDataFromEs retries after a response of 429", async () => {
    //nock()
    //http://localhost/dt-nginx-*/path
    nock("http://localhost")
        .post("/dt-nginx-*/path")
        .reply(429)
        .post("/dt-nginx-*/path")
        .reply(200, { foo: "bar" });
    //AWS.NodeHttpClient.mockIncomingStatusCodeOnce(429).mockIncomingStatusCodeOnce(200);
    await esQuery.fetchDataFromEs(new AWS.Endpoint("http://localhost"), "query", "path");

    //jest.fn().mockImplementationOnce(() => {});

    expect(esQuery.retryCount).toBe(1);
    //expect(esQuery.handleRequest).toHaveBeenCalledTimes(2);
}, 10000);
