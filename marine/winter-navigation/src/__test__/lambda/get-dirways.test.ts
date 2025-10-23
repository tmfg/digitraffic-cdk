import { type DTDatabase } from "@digitraffic/common/dist/database/database";
import { dbTestBase } from "../db-testutil.js";
import { ExpectResponse } from "@digitraffic-cdk/testing";
import { type LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import {
  type DirwayFeatureCollection,
  type DTDirway,
} from "../../model/dt-apidata.js";
import { saveAllDirwaypoints, saveAllDirways } from "../../db/dirways.js";
import {
  createDirwaypoint,
  DIRWAY_1,
  DIRWAYPOINT_1,
} from "../service/data-updater.test.js";
import { mockProxyHolder } from "../mock.js";

mockProxyHolder();

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
      ExpectResponse.ok(response).expectContent(
        (body: DirwayFeatureCollection) => {
          expect(body.type).toEqual("FeatureCollection");
          expect(body.features).toEqual([]);
          expect(body).toHaveProperty("lastUpdated");
        },
      );
    });

    test("get all - one dirway", async () => {
      await saveAllDirways(db, [DIRWAY_1]);

      const point1 = createDirwaypoint({
        id: "id1",
        dirway_id: DIRWAY_1.id,
        latitude: 1,
        longitude: 2,
        order_num: 1,
      });
      const point2 = createDirwaypoint({
        id: "id2",
        dirway_id: DIRWAY_1.id,
        latitude: 3,
        longitude: 4,
        order_num: 2,
      });
      await saveAllDirwaypoints(db, [point1, point2]);

      const response = await getResponseFromLambda();

      ExpectResponse.ok(response).expectContent(
        (dirways: DirwayFeatureCollection) => {
          expect(dirways.features.length).toEqual(1);

          const feature = dirways.features[0]!;
          expect(feature.properties.description).toEqual(DIRWAY_1.description);

          const geometry = feature.geometry;
          expect(geometry.type).toEqual("LineString");

          if (geometry.type === "LineString") {
            expect(geometry.coordinates.length).toEqual(2);
            expect(geometry.coordinates[0]).toEqual([
              point1.longitude,
              point1.latitude,
            ]);
            expect(geometry.coordinates[1]).toEqual([
              point2.longitude,
              point2.latitude,
            ]);
          }
        },
      );
    });
  }),
);
