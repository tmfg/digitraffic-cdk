import { type DTDatabase } from "@digitraffic/common/dist/database/database";
import { ExpectResponse, mockProxyHolder } from "@digitraffic-cdk/testing";
import { dbTestBase } from "../db-testutil.js";
import { type LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import type { ResponseValue } from "../../model/v2/response-model.js";
import { insertSite } from "./get-sites.test.js";
import { addSiteData } from "../../dao/data.js";

mockProxyHolder();

async function insertData(db: DTDatabase, timestamp: Date): Promise<void> {    
    await addSiteData(db, 1, [{
        travelMode: "bike",
        direction: "in",
        data: [{
            timestamp,
            granularity: "P1D",
            counts: 1
        }]
    }]);
}

async function getResponseFromLambda(event: Record<string, string> = {}): Promise<LambdaResponse> {
    const { handler } = await import("../../lambda/get-values/get-values.js");

    return await handler(event);
}

describe("get-values-lambda", dbTestBase((db: DTDatabase) => {

    test.each(["2024-13-33", "2024-08-08T16:44:04Z"])("should fail when date is %s", async (date) => {
        const response = await getResponseFromLambda({date});

        new ExpectResponse(response).expectStatus(400);        
    });    

    test("get values - wrong parameters", async () => {
        const response = await getResponseFromLambda({foo: "bar"});

        new ExpectResponse(response).expectStatus(400);
    });

    test("get values - invalid traveltype", async () => {
        const response = await getResponseFromLambda({date: "2024-08-01", travelType: "eurofighter"});

        new ExpectResponse(response).expectStatus(400);
    });

    test("get values - with date no data", async () => {
        const response = await getResponseFromLambda({date: "2024-08-01"});

        ExpectResponse.ok(response).expectContent((values: ResponseValue[]) => {
            expect(values).toHaveLength(0);
        });
    });

    test("get values - with date - data found", async () => {
        await insertSite(db);
        await insertData(db, new Date(2024, 7, 1, 10, 10));

        const response = await getResponseFromLambda({date: "2024-08-01"});

        ExpectResponse.ok(response).expectContent((values: ResponseValue[]) => {
            expect(values).toHaveLength(1);
        });
    });

    test("get values - with date & travelmode - data found", async () => {
        await insertSite(db);
        await insertData(db, new Date(2024, 7, 1, 10, 10));

        const response = await getResponseFromLambda({date: "2024-08-01", travelMode: "bike"});

        ExpectResponse.ok(response).expectContent((values: ResponseValue[]) => {
            expect(values).toHaveLength(1);
        });
    });

    test("get values - with date & wrong travelmode - no data", async () => {
        await insertSite(db);
        await insertData(db, new Date(2024, 7, 1, 10, 10));

        const response = await getResponseFromLambda({date: "2024-08-01", travelMode: "car"});

        ExpectResponse.ok(response).expectContent((values: ResponseValue[]) => {
            expect(values).toHaveLength(0);
        });
    });

    test("get values - with date - wrong siteId", async () => {
        await insertSite(db);
        await insertData(db, new Date(2024, 7, 1, 10, 10));

        const response = await getResponseFromLambda({date: "2024-08-01", siteId: "2"});

        ExpectResponse.ok(response).expectContent((values: ResponseValue[]) => {
            expect(values).toHaveLength(0);
        });
    });

}));