import type { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { ExpectResponse, mockProxyHolder } from "@digitraffic-cdk/testing";
import { addSiteData } from "../../dao/data.js";
import { dbTestBase } from "../db-testutil.js";
import { insertSite } from "./get-sites.test.js";

mockProxyHolder();

async function insertData(db: DTDatabase, timestamp: Date): Promise<void> {
  await addSiteData(db, 1, [
    {
      travelMode: "bike",
      direction: "in",
      data: [
        {
          timestamp,
          granularity: "P1D",
          counts: 1,
        },
      ],
    },
  ]);
}

const DATA_DATE = new Date(2024, 7, 1, 10, 10);
const EXPECTED_DATA_LINE = `name1,bike,${DATA_DATE.toISOString()},P1D,in,1\r\n`;
const EXPECTED_CSV_HEADER =
  "SITE,TRAVELMODE,TIMESTAMP,GRANULARITY,DIRECTION,COUNT\r\n" as const;

async function getResponseFromLambda(
  event: Record<string, string> = {},
): Promise<LambdaResponse> {
  const { handler } = await import(
    "../../lambda/get-values-csv/get-values-csv.js"
  );

  return await handler(event);
}

describe(
  "get-values-csv-lambda",
  dbTestBase((db: DTDatabase) => {
    test.each([
      "2024-13-33",
      "2024-08-08T16:44:04Z",
    ])("should fail when date is %s", async (date) => {
      const response = await getResponseFromLambda({ date });

      new ExpectResponse(response).expectStatus(400);
    });

    test("get values - no parameters", async () => {
      const response = await getResponseFromLambda();

      new ExpectResponse(response).expectStatus(400);
    });

    test("get values - wrong parameters", async () => {
      const response = await getResponseFromLambda({ foo: "bar" });

      new ExpectResponse(response).expectStatus(400);
    });

    test("get values - invalid traveltype", async () => {
      const response = await getResponseFromLambda({
        travelType: "eurofighter",
      });

      new ExpectResponse(response).expectStatus(400);
    });

    test("get values - with date no data", async () => {
      const response = await getResponseFromLambda({
        year: "2024",
        month: "8",
        siteId: "1",
      });

      ExpectResponse.ok(response).expectBody(EXPECTED_CSV_HEADER);
    });

    test("get values - with date - data found", async () => {
      await insertSite(db);
      await insertData(db, DATA_DATE);

      const response = await getResponseFromLambda({
        year: "2024",
        month: "8",
        siteId: "1",
      });

      ExpectResponse.ok(response).expectBody(
        EXPECTED_CSV_HEADER + EXPECTED_DATA_LINE,
      );
    });

    test("get values - with date & travelmode - data found", async () => {
      await insertSite(db);
      await insertData(db, DATA_DATE);

      const response = await getResponseFromLambda({
        year: "2024",
        month: "8",
        siteId: "1",
        travelMode: "bike",
      });

      ExpectResponse.ok(response).expectBody(
        EXPECTED_CSV_HEADER + EXPECTED_DATA_LINE,
      );
    });

    test("get values - with date & wrong travelmode - no data", async () => {
      await insertSite(db);
      await insertData(db, DATA_DATE);

      const response = await getResponseFromLambda({
        year: "2024",
        month: "8",
        siteId: "1",
        travelMode: "car",
      });

      ExpectResponse.ok(response).expectBody(EXPECTED_CSV_HEADER);
    });
  }),
);
