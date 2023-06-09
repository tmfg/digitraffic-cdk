import "source-map-support/register";
import * as AWSx from "aws-sdk";

const AWS = AWSx as any;

const region = "eu-west-1";

export async function fetchDataFromEs(endpoint: AWS.Endpoint, query: string, path: string): Promise<any> {
    return new Promise((resolve) => {
        const creds = new AWS.EnvironmentCredentials("AWS");
        const req = new AWS.HttpRequest(endpoint);
        const index = "dt-nginx-*";

        req.method = "POST";
        req.path = `/${index}/${path}`;
        req.region = region;
        req.headers.Host = endpoint.host;
        req.headers["Content-Type"] = "application/json";
        req.body = query;

        const signer = new AWS.Signers.V4(req, "es");
        signer.addAuthorization(creds, new Date());

        const send = new AWS.NodeHttpClient();

        send.handleRequest(
            req,
            null,
            function (httpResp: any) {
                let respBody = "";
                httpResp.on("data", function (chunk: any) {
                    respBody += chunk;
                });
                httpResp.on("end", function () {
                    resolve(JSON.parse(respBody));
                });
            },
            function (err: any) {
                console.error("Error: " + err);
            }
        );
    });
}
