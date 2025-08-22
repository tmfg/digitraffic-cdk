import { type DTDatabase } from "@digitraffic/common/dist/database/database";
import { dbTestBase } from "../db-testutil.js";
import { ExpectResponse } from "@digitraffic-cdk/testing";
import { type LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { type DTDirway } from "../../model/dt-apidata.js";
import { saveAllDirwaypoints, saveAllDirways } from "../../db/dirways.js";
import { DIRWAY_1, DIRWAYPOINT_1 } from "../service/data-updater.test.js";
import { jest } from "@jest/globals";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";

// for some reason, mockProxyHolder does not work here!?!
jest.spyOn(ProxyHolder.prototype, "setCredentials").mockImplementation(() =>
  Promise.resolve()
);

async function insertDirway(db: DTDatabase): Promise<void> {
  await saveAllDirways(db, [DIRWAY_1]);
  await saveAllDirwaypoints(db, [DIRWAYPOINT_1]);
}

async function getResponseFromLambda(
  event: Record<string, string> = {},
): Promise<LambdaResponse> {
  const { handler } = await import("../../lambda/get-dirways/get-dirways.js");

  return await handler(event);
}

describe(
  "get-dirways-lambda",
  dbTestBase((db: DTDatabase) => {
    test("get all - empty", async () => {
      const response = await getResponseFromLambda();

      ExpectResponse.ok(response).expectJson([]);
    });

    test("get all - one dirway", async () => {
      await insertDirway(db);

      const response = await getResponseFromLambda();

      ExpectResponse.ok(response).expectContent((dirways: DTDirway[]) => {
        expect(dirways.length).toEqual(1);

        expect(dirways[0]!.description).toEqual(DIRWAY_1.description);
        expect(dirways[0]!.dirwaypoints?.length).toEqual(1);
        expect(dirways[0]!.dirwaypoints![0]!.latitude).toEqual(
          DIRWAYPOINT_1.latitude,
        );
      });
    });
  }),
);
