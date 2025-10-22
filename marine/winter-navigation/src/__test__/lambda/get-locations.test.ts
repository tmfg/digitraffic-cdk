import { type DTDatabase } from "@digitraffic/common/dist/database/database";
import { dbTestBase } from "../db-testutil.js";
import { ExpectResponse } from "@digitraffic-cdk/testing";
import { saveAllLocations } from "../../db/locations.js";
import {
  LOCATION_1,
  PORT_SUSPENSION_1,
  PORT_SUSPENSION_LOCATION_1,
  RESTRICTION_1,
} from "../service/data-updater.test.js";
import {
  type DTLocation,
  type LocationFeature,
  type LocationFeatureCollection,
} from "../../model/dt-apidata.js";
import { type LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { saveAllRestrictions } from "../../db/restrictions.js";
import {
  saveAllPortSuspensionLocations,
  saveAllPortSuspensions,
} from "../../db/port-suspensions.js";
import { mockProxyHolder } from "../mock.js";

mockProxyHolder();

async function insertLocation(db: DTDatabase): Promise<void> {
  await saveAllLocations(db, [LOCATION_1]);
  await saveAllRestrictions(db, [RESTRICTION_1]);
  await saveAllPortSuspensions(db, [PORT_SUSPENSION_1]);
  await saveAllPortSuspensionLocations(db, [PORT_SUSPENSION_LOCATION_1]);
}

async function getResponseFromLambda(
  event: Record<string, string> = {},
): Promise<LambdaResponse> {
  const { handler } = await import(
    "../../lambda/get-locations/get-locations.js"
  );

  return await handler(event);
}

describe(
  "get-locations-lambda",
  dbTestBase((db: DTDatabase) => {
    test("get all - empty", async () => {
      const response = await getResponseFromLambda();

      ExpectResponse.ok(response).expectJson({
        "type": "FeatureCollection",
        "features": [],
      });
    });

    test("get all - one location", async () => {
      await insertLocation(db);

      const response = await getResponseFromLambda();

      ExpectResponse.ok(response).expectContent(
        (locations: LocationFeatureCollection) => {
          expect(locations.features.length).toEqual(1);
        },
      );
    });

    test("get one - not found", async () => {
      const response = await getResponseFromLambda({ "location-id": "foo" });

      ExpectResponse.notFound(response);
    });

    test("get one - found", async () => {
      await insertLocation(db);

      const response = await getResponseFromLambda({ "location-id": "id1" });

      ExpectResponse.ok(response).expectContent((location: LocationFeature) => {
        expect(location.properties.name).toEqual(LOCATION_1.name);
        expect(location.properties.restrictions?.length).toEqual(1);
        expect(location.properties.restrictions![0]!.textCompilation).toEqual(
          RESTRICTION_1.text_compilation,
        );

        expect(location.properties.suspensions?.length).toEqual(1);
        expect(location.properties.suspensions![0]!.dueTo).toEqual(
          PORT_SUSPENSION_1.due_to,
        );
      });
    });
  }),
);
