import { ExpectResponse } from "@digitraffic-cdk/testing";
import { type DTDatabase } from "@digitraffic/common/dist/database/database";
import { dbTestBase, mockProxyHolder } from "../db-testutil.js";
import { type LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { saveAllVessels } from "../../db/vessels.js";
import { ACTIVITY_1, VESSEL_1 } from "../service/data-updater.test.js";
import { saveAllActivities } from "../../db/activities.js";
import type { DTVessel } from "../../model/dt-apidata.js";

await mockProxyHolder();

async function insertVessel(db: DTDatabase): Promise<void> {
  await saveAllVessels(db, [VESSEL_1]);
  await saveAllActivities(db, [ACTIVITY_1]);
}

async function getResponseFromLambda(
  event: Record<string, string> = {},
): Promise<LambdaResponse> {
  const { handler } = await import("../../lambda/get-vessels/get-vessels.js");

  return await handler(event);
}

describe(
  "get-vessels-lambda",
  dbTestBase((db: DTDatabase) => {
    test("get all - empty", async () => {
      const response = await getResponseFromLambda();

      ExpectResponse.ok(response).expectJson([]);
    });

    test("get all - one location", async () => {
      await insertVessel(db);

      const response = await getResponseFromLambda();

      ExpectResponse.ok(response).expectContent((vessels: DTVessel[]) => {
        expect(vessels.length).toEqual(1);
      });
    });

    test("get one - not found", async () => {
      const response = await getResponseFromLambda({ "vessel-id": "foo" });

      ExpectResponse.notFound(response);
    });

    test("get one - found", async () => {
      await insertVessel(db);

      const response = await getResponseFromLambda({ "vessel-id": "id1" });

      ExpectResponse.ok(response).expectContent((vessel: DTVessel) => {
        expect(vessel.name).toEqual(VESSEL_1.name);
        expect(vessel.activities?.length).toEqual(1);
        expect(vessel.activities![0]!.reason).toEqual(ACTIVITY_1.reason);
      });
    });
  }),
);
