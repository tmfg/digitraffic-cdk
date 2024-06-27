import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { DTDatabase } from "@digitraffic/common/dist/database/database";
import { dbTestBase as commonDbTestBase } from "@digitraffic/common/dist/test/db-testutils";
import { ListenProperties, TestHttpServer } from "@digitraffic/common/dist/test/httpserver";
import { hasOwnPropertySafe } from "@digitraffic/common/dist/utils/utils";
import * as sinon from "sinon";
import { VersionString } from "../lib/api/ocpi/ocpi-api-responses";
import { ChargingNetworkKeys } from "../lib/keys";
import { VERSION_2_1_1 } from "../lib/model/ocpi-constants";

export const PORT = 8091 as const;
const service = "DbTestutil.ts";

export function dbTestBase(fn: (db: DTDatabase) => void): () => void {
    return commonDbTestBase(fn, truncate, "road", "road", "localhost:54322/road");
}

export async function truncate(db: DTDatabase): Promise<void> {
    await db.tx(async (t) => {
        await t.none("DELETE FROM ocpi_location");
        await t.none("DELETE FROM ocpi_cpo_module_endpoint");
        await t.none("DELETE FROM ocpi_cpo_version");
        await t.none("DELETE FROM ocpi_cpo_business_details");
        await t.none("DELETE FROM ocpi_cpo");
        await t.none(`DELETE FROM ocpi_version where version <> '${VERSION_2_1_1}'`);
    });
}

export async function insertOcpiCpo(
    db: DTDatabase,
    cpo: string,
    name: string,
    tokenA: string,
    tokenB: string | undefined,
    tokenC: string | undefined,
    versionsEndpoint: string
): Promise<void> {
    await db.tx((t) => {
        return t.none(
            `insert into ocpi_cpo(dt_cpo_id, dt_cpo_name, token_a, token_b, token_c, versions_endpoint)
             values($1, $2, $3, $4, $5, $6)`,
            [cpo, name, tokenA, tokenB, tokenC, versionsEndpoint]
        );
    });
}

export async function insertOcpiVersion(db: DTDatabase, version: VersionString): Promise<void> {
    await db.tx((t) => {
        return t.none(
            `insert into ocpi_version (version)
             values($1)`,
            [version]
        );
    });
}

export type UrlResponsePair = [url: string, response: object];

/* TODO: use SuperTest? https://github.com/ladjs/supertest */
export async function withServer(
    urlResponsePairs: UrlResponsePair[],
    fn: (server: TestHttpServer) => Promise<void>
): Promise<void> {
    const server = new TestHttpServer();

    let httpPort = 80;
    const props: ListenProperties = {};
    urlResponsePairs.forEach(([url, response]) => {
        const parsedURL = new URL(url);
        if (parsedURL.port) {
            // If port is defined use it
            // Remove leading colon from the port number
            httpPort = parseInt(parsedURL.port, 10);
        }
        const path = parsedURL.pathname;
        const responseStr = JSON.stringify(response);
        props[path] = (url?, data?) => {
            logger.info({
                method: `TestHttpServer.request`,
                customUrl: url,
                customData: JSON.stringify(data),
                customResponse: responseStr
            });
            return responseStr;
        };
        logger.info({
            message: "Register test server to listen",
            method: `${service}.withServer`,
            customHttpPort: httpPort,
            customPath: path,
            customResponse: responseStr
        });
    });

    server.listen(httpPort, props, false);

    try {
        await fn(server);
    } finally {
        server.close();
    }
}

export function decodeBody(response: LambdaResponse): string {
    return Buffer.from(response.body, "base64").toString();
}

export function decodeBodyToObject(response: LambdaResponse): object {
    return JSON.parse(Buffer.from(response.body, "base64").toString()) as object;
}

export function prettyJson(object: object | string, nullifyFields?: [string]): string {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const json: object = typeof object === "string" ? JSON.parse(object) : object;
    if (nullifyFields && nullifyFields.length) {
        nullifyFields.forEach((field) => {
            if (hasOwnPropertySafe(json, field)) {
                // @ts-ignore
                json[field as keyof typeof json] = null;
            }
        });
    }
    return JSON.stringify(json, null, 2);
}

export function setTestEnv(): void {
    process.env.SECRET_ID = "TEST_SECRET";
    process.env.AWS_REGION = "aws-region";
    process.env[ChargingNetworkKeys.OCPI_DOMAIN_URL] = `http://localhost:${PORT}`;
    process.env[ChargingNetworkKeys.OCPI_PARTY_ID] = "DTT";
    process.env[ChargingNetworkKeys.OCPI_BUSINESS_DETAILS_NAME] = `Digitraffic test`;
    process.env[ChargingNetworkKeys.OCPI_BUSINESS_DETAILS_WEBSITE] = "https://www.digitraffic.fi/";
    sinon.stub(ProxyHolder.prototype, "setCredentials").returns(Promise.resolve());
}

export function getLambdaInputAuthorizerEvent(dtCpoId: string | undefined): Record<string, string> {
    return {
        "authorizer.dtCpoId": `[${dtCpoId ? dtCpoId : ""}]`
    };
}

export function roundToNearestSecond(date: Date): Date {
    return new Date(1000 * Math.round(date.getTime() / 1000));
}
