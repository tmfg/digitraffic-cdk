import { type DTDatabase } from "@digitraffic/common/dist/database/database";
import { dbTestBase } from "../db-testutil.js";
import { ExpectResponse } from "@digitraffic-cdk/testing";
import { type LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { saveAllVessels } from "../../db/vessels.js";
import {
  ACTIVITY_1,
  createActivity,
  createQueue,
  createSource,
  createVessel,
  VESSEL_1,
} from "../service/data-updater.test.js";
import {
  type DTVessel,
  isAssistanceGiven,
  isAssistanceReceived,
} from "../../model/dt-apidata.js";
import { saveAllActivities } from "../../db/activities.js";
import { mockProxyHolder } from "../mock.js";
import { saveAllQueues } from "../../db/queues.js";
import type {
  ActivityDB,
  QueueDB,
  Source,
  Vessel,
} from "../../model/apidata.js";
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
    activities?: ActivityDB[];
    queues?: QueueDB[];
    sources?: Source[];
  },
): Promise<void> {
  await saveAllVessels(db, props.vessels);
  if (props.activities) await saveAllActivities(db, props.activities);
  if (props.queues) await saveAllQueues(db, props.queues);
  if (props.sources) await saveAllSources(db, props.sources);
}

async function getResponseFromLambda(
  event: Record<string, number> = {},
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
      const response = await getResponseFromLambda({ "vessel-id": 123 });

      ExpectResponse.notFound(response);
    });

    test("get one - found", async () => {
      await insertVessel(db);

      const response = await getResponseFromLambda({
        "vessel-id": VESSEL_1.imo ?? 123,
      });

      ExpectResponse.ok(response).expectContent((vessel: DTVessel) => {
        expect(vessel.name).toEqual(VESSEL_1.name);
        expect(vessel.activities?.length).toEqual(1);
        expect(vessel.activities![0]!.reason).toEqual(ACTIVITY_1.reason);
      });
    });

    test("get multiple - different types of activities", async () => {
      const icebreaker = createVessel({ id: "1", type: "Icebreaker", imo: 1 });
      const assistedVessel = createVessel({
        id: "2",
        type: "General Cargo",
        imo: 2,
      });
      const anotherVessel = createVessel({ id: "3" });
      const icebreakerSource = createSource({ vessel_id: icebreaker.id });
      const activities = [
        createActivity({
          id: "a1",
          icebreaker_id: icebreakerSource.id,
          vessel_id: assistedVessel.id,
          type: "TOW",
        }),
        createActivity({
          id: "a2",
          icebreaker_id: icebreakerSource.id,
          type: "MOVE",
        }),
        createActivity({ id: "a3", vessel_id: anotherVessel.id, type: "WAIT" }),
      ];

      await insertVessels(db, {
        vessels: [icebreaker, assistedVessel, anotherVessel],
        sources: [icebreakerSource],
        activities,
      });

      const response = await getResponseFromLambda();

      ExpectResponse.ok(response).expectContent((vessels: DTVessel[]) => {
        expect(vessels.length).toEqual(3);

        const apiIcebreaker = vessels.find((v) => v.imo === icebreaker.imo);
        const apiAssistedVessel = vessels.find(
          (v) => v.imo === assistedVessel.imo,
        );
        const apiAnotherVessel = vessels.find(
          (v) => v.imo === anotherVessel.imo,
        );

        expect(apiAssistedVessel?.activities).toHaveLength(1);
        const receivedActivity = apiAssistedVessel?.activities?.[0];
        expect(receivedActivity).toEqual(
          expect.objectContaining({ type: "TOW" }),
        );
        if (!receivedActivity || !isAssistanceReceived(receivedActivity)) {
          fail("Expected activity to be of type AssistanceReceived");
        }
        expect(receivedActivity.assistingVessel.imo).toEqual(icebreaker.imo);

        expect(apiIcebreaker?.activities).toHaveLength(2);
        const givenActivity = apiIcebreaker?.activities?.find(
          (a) => a.type === "TOW",
        );
        expect(givenActivity).toBeDefined();
        if (!givenActivity || !isAssistanceGiven(givenActivity)) {
          fail("Expected activity to be of type AssistanceGiven");
        }
        expect(givenActivity.assistedVessel.imo).toEqual(assistedVessel.imo);

        expect(apiAnotherVessel?.activities).toHaveLength(1);
        const singleVesselActivity = apiAnotherVessel?.activities?.[0];
        expect(singleVesselActivity?.type).toEqual("WAIT");
        expect(singleVesselActivity).not.toHaveProperty("assistedVessel");
        expect(singleVesselActivity).not.toHaveProperty("assistingVessel");
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
        const apiVessel = vessels.find(
          (vessel) => vessel.imo === assistedVessel.imo,
        );
        const apiIcebreaker = vessels.find(
          (vessel) => vessel.imo === icebreaker.imo,
        );

        // Check the assisted vessel's planned assistance
        expect(apiVessel?.plannedAssistances).toHaveLength(1);
        const receivedAssistance = apiVessel?.plannedAssistances?.[0];
        if (!receivedAssistance || !isAssistanceReceived(receivedAssistance)) {
          fail("Expected assistance to be of type AssistanceReceived");
        }
        expect(receivedAssistance.assistingVessel.imo).toEqual(
          icebreaker.imo,
        );

        // Check the icebreaker's planned assistance
        expect(apiIcebreaker?.plannedAssistances).toHaveLength(1);
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
