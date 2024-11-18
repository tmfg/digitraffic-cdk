import { type DTDatabase } from "@digitraffic/common/dist/database/database";
import { ExpectResponse } from "@digitraffic-cdk/testing";
import { dbTestBase } from "../db-testutil.js";
import { type LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import type { FeatureCollection } from "geojson";
import { addSites } from "../../dao/site.js";
import type { ApiSite } from "../../model/v2/api-model.js";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { jest } from "@jest/globals";

// for some reason, mockProxyHolder does not work here!?!
jest.spyOn(ProxyHolder.prototype, "setCredentials").mockImplementation(() => Promise.resolve());

export const TEST_SITE_1: ApiSite = {
    id: 1,
    name: "name1",
    description: "description1",
    customId: "custom1",
    location: {
        lat: 60,
        lon: 30
    },
    granularity: "PT15M",
    travelModes: ["bike"],
    directional: false
};

export const DOMAIN = "Fintraffic";

export async function insertSite(db: DTDatabase): Promise<void> {
    await addSites(db, DOMAIN, [TEST_SITE_1]);
}

async function getResponseFromLambda(event: Record<string, string> = {}): Promise<LambdaResponse> {
    const { handler } = await import("../../lambda/get-sites/get-sites.js");

    return await handler(event);
}

describe(
    "get-sites-lambda",
    dbTestBase((db: DTDatabase) => {
        test("get all - one", async () => {
            await insertSite(db);

            const response = await getResponseFromLambda();

            ExpectResponse.ok(response).expectContent((content: FeatureCollection) => {
                expect(content.type).toEqual("FeatureCollection");
                expect(content.features).toHaveLength(1);
            });
        });

        test("get with wrong parameters", async () => {
            const response = await getResponseFromLambda({ doesNotExists: "1" });

            new ExpectResponse(response).expectStatus(400);
        });

        test("get one - not found", async () => {
            const response = await getResponseFromLambda({ siteId: "1" });

            ExpectResponse.notFound(response);
        });

        test("get one with siteId - found", async () => {
            await insertSite(db);

            const response = await getResponseFromLambda({ siteId: "1" });

            ExpectResponse.ok(response).expectContent((content: FeatureCollection) => {
                expect(content.type).toEqual("FeatureCollection");
                expect(content.features).toHaveLength(1);
            });
        });

        test("get one with domain - found", async () => {
            await insertSite(db);

            const response = await getResponseFromLambda({ domain: DOMAIN });

            ExpectResponse.ok(response).expectContent((content: FeatureCollection) => {
                expect(content.type).toEqual("FeatureCollection");
                expect(content.features).toHaveLength(1);
            });
        });

        test("get one with domain - no sites found", async () => {
            await insertSite(db);

            const response = await getResponseFromLambda({ domain: "wrong" });

            ExpectResponse.ok(response).expectContent((content: FeatureCollection) => {
                expect(content.type).toEqual("FeatureCollection");
                expect(content.features).toHaveLength(0);
            });
        });
    })
);
