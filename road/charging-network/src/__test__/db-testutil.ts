import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import type { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { dbTestBase as commonDbTestBase } from "@digitraffic/common/dist/test/db-testutils";
import * as nock from "nock";
import { hasOwnPropertySafe } from "@digitraffic/common/dist/utils/utils";
import * as sinon from "sinon";
import type { VersionString } from "../api/ocpi/ocpi-api-responses.js";
import { ChargingNetworkKeys } from "../keys.js";
import { VERSION_2_1_1 } from "../model/ocpi-constants.js";

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
    // eslint-disable-next-line dot-notation
    process.env["SECRET_ID"] = "TEST_SECRET";
    // eslint-disable-next-line dot-notation
    process.env["AWS_REGION"] = "aws-region";
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
