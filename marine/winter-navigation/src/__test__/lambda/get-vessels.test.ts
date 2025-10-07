import { type DTDatabase } from "@digitraffic/common/dist/database/database";
import { dbTestBase } from "../db-testutil.js";
import { ExpectResponse } from "@digitraffic-cdk/testing";
import { type LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { saveAllVessels } from "../../db/vessels.js";
import {
  ACTIVITY_1,
  createQueue,
  createSource,
  createVessel,
  VESSEL_1,
} from "../service/data-updater.test.js";
import {
  type AssistanceGiven,
  type AssistanceReceived,
  type DTVessel,
  isAssistanceGiven,
  isAssistanceReceived,
} from "../../model/dt-apidata.js";
import { saveAllActivities } from "../../db/activities.js";
import { mockProxyHolder } from "../mock.js";
import { saveAllQueues } from "../../db/queues.js";
import type { Activity, Queue, Source, Vessel } from "../../model/apidata.js";
import { saveAllSources } from "../../db/sources.js";

mockProxyHolder();

async function insertVessel(db: DTDatabase): Promise<void> {
  await saveAllVessels(db, [VESSEL_1]);
  await saveAllActivities(db, [ACTIVITY_1]);
}

async function insertVessels(
  db: DTDatabase,
  props: {
    vessels: Vessel[];
    activities?: Activity[];
    queues?: Queue[];
    sources?: Source[];
  },
) {
  await saveAllVessels(db, props.vessels);
  if (props.activities) await saveAllActivities(db, props.activities);
  if (props.queues) await saveAllQueues(db, props.queues);
  if (props.sources) await saveAllSources(db, props.sources);
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

    test("get multiple - found with valid planned assistances", async () => {
      const icebreaker = createVessel({ id: "1", type: "Icebreaker", imo: 1 });
      const assistedVessel = createVessel({
        id: "2",
        type: "General Cargo",
        imo: 2,
      });
      const anotherVessel = createVessel({ id: "3" });

      const icebreakerSource = createSource({ vessel_id: icebreaker.id });
      const queue = createQueue({
        icebreaker_id: icebreakerSource.id,
        vessel_id: assistedVessel.id,
      });

      await insertVessels(db, {
        vessels: [icebreaker, assistedVessel, anotherVessel],
        queues: [queue],
        sources: [icebreakerSource],
      });

      const response = await getResponseFromLambda();

      ExpectResponse.ok(response).expectContent((vessels: DTVessel[]) => {
        expect(vessels.length).toEqual(3);
        const apiVessel = vessels.find((vessel) =>
          vessel.imo === assistedVessel.imo
        );
        const apiIcebreaker = vessels.find((vessel) =>
          vessel.imo === icebreaker.imo
        );

        expect(apiVessel?.plannedAssistances?.length).toEqual(1);
        const assistance = apiVessel?.plannedAssistances?.[0];
        if (!assistance || !isAssistanceReceived(assistance)) {
          fail("Expected assistance to be of type AssistanceReceived");
        }
        expect(assistance.assistingVessel.imo).toEqual(icebreaker.imo);

        expect(apiIcebreaker?.plannedAssistances?.length).toEqual(1);
        const icebreakerAssistance = apiIcebreaker?.plannedAssistances?.[0];
        if (!icebreakerAssistance || !isAssistanceGiven(icebreakerAssistance)) {
          fail("Expected assistance to be of type AssistanceGiven");
        }
        expect(icebreakerAssistance.assistedVessel.imo).toEqual(
          assistedVessel.imo,
        );
      });
    });
  }),
);
