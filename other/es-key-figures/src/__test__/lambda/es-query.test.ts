//import * as http from "http";
//import * as AWSx from "aws-sdk";
//import * as esQuery from "../../lambda/es-query";
import type { IncomingMessage } from "http";
/*import * as AWSx from "aws-sdk";

const AWS = AWSx as any;*/

/*type IncomingMessageMock = jest.Mock<IncomingMessage> & {
    statusCode: number;
}*/

jest.mock("http");
const http = require("http");

function IncomingMessageMock(code) {
    /*const mockRaw: Record<string, any> = jest.fn();
    mockRaw.statusCode = code;
    return mockRaw as IncomingMessageMock;*/
    this.statusCode = code;
}

IncomingMessageMock.prototype = http.IncomingMessage.prototype;

http.IncomingMessage = IncomingMessageMock;

jest.mock("aws-sdk");
const AWS = require("aws-sdk");

const NodeHttpClientMock = (function () {
    let nextIncomingMessage = jest.fn(() => {
        return new IncomingMessageMock(200);
    });

    const foo = function () {
        this.handleRequest = jest.fn((req, som, callback, errCallback) => {
            const incomingMessage = nextIncomingMessage();
            callback(incomingMessage);
        });
    };

    foo.mockIncomingStatusCodeOnce = function (code: number) {
        nextIncomingMessage.mockImplementationOnce(() => {
            return new IncomingMessageMock(code);
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

AWS.HttpRequest = HttpRequestMock;

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
});

const AWS = require('aws-sdk');*/

/*jest.mock('../../lambda/es-query', () => {
    const originalModule = jest.requireActual('../../lambda/es-query');
    return {
        __esModule: true,
        ...originalModule,
        addCredentialsToEsRequest: jest.fn((req) => {}),
        createRequestForEs: jest.fn((endpoint, query, path) => new AWS.HttpRequest(endpoint)),
    }
});*/

const esQuery = require("../../lambda/es-query");

test("fetchDataFromEs retries after a response of 429", async () => {
    AWS.NodeHttpClient.mockIncomingStatusCodeOnce(429).mockIncomingStatusCodeOnce(200);
    await esQuery.fetchDataFromEs(new AWS.Endpoint("http://localhost"), "query", "path");

    //jest.fn().mockImplementationOnce(() => {});

    expect(esQuery.handleRequest).toHaveBeenCalledTimes(2);
});
