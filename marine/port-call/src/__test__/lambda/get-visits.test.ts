import type { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { ExpectResponse } from "@digitraffic-cdk/testing";
import { addHours } from "date-fns";
import type { VisitResponse } from "../../model/visit-schema.js";
import {
  assertVisitCount,
  dbTestBase,
  mockProxyAndSecretHolder,
} from "../db-testutil.js";
import { updateAndExpect } from "../service/visits-service.test.js";
import { createTestVisit } from "../testdata.js";

// eslint-disable-next-line dot-notation
process.env["SECRET_ID"] = "";
// eslint-disable-next-line dot-notation
process.env["AWS_REGION"] = "eu-west-1";

mockProxyAndSecretHolder();

async function getResponseFromLambda(
  event: Record<string, string> = {},
): Promise<LambdaResponse> {
  const { handler } = await import("../../lambda/get-visits/get-visits.js");

  return await handler(event);
}

describe(
  "get-visits-lambda-tests",
  dbTestBase((db: DTDatabase) => {
    test("no visits", async () => {
      const response = await getResponseFromLambda();

      ExpectResponse.ok(response).expectJson([]);
    });

    test("invalid parameter", async () => {
      const response = await getResponseFromLambda({ answer: "42" });

      ExpectResponse.badRequest(response);
    });

    test("one visit", async () => {
      const testVisit = createTestVisit();
      await updateAndExpect([testVisit], 1, 0, 1);
      await assertVisitCount(db, 1);

      const response = await getResponseFromLambda();
      ExpectResponse.ok(response).expectJson([
        {
          ata: undefined,
          atd: undefined,
          eta: testVisit.portCall.voyageInformation.estimatedArrivalDateTime.toISOString(),
          etd: testVisit.portCall.voyageInformation.estimatedDepartureDateTime!.toISOString(),
          portLocode: testVisit.portCall.voyageInformation.portIdentification,
          status: testVisit.portCall.portCallStatus.status,
          updateTime: testVisit.latestUpdateTime.toISOString(),
          vesselId: testVisit.portCall.vesselInformation.identification,
          vesselName: testVisit.portCall.vesselInformation.name,
          visitId: testVisit.visitId,
        } satisfies VisitResponse,
      ]);
    });

    test("one visit - match from inclusive", async () => {
      const testVisit = createTestVisit();
      await updateAndExpect([testVisit], 1, 0, 1);
      await assertVisitCount(db, 1);

      const response = await getResponseFromLambda({
        from: testVisit.latestUpdateTime.toISOString(),
      });
      ExpectResponse.ok(response).expectJson([
        {
          ata: undefined,
          atd: undefined,
          eta: testVisit.portCall.voyageInformation.estimatedArrivalDateTime.toISOString(),
          etd: testVisit.portCall.voyageInformation.estimatedDepartureDateTime!.toISOString(),
          portLocode: testVisit.portCall.voyageInformation.portIdentification,
          status: testVisit.portCall.portCallStatus.status,
          updateTime: testVisit.latestUpdateTime.toISOString(),
          vesselId: testVisit.portCall.vesselInformation.identification,
          vesselName: testVisit.portCall.vesselInformation.name,
          visitId: testVisit.visitId,
        } satisfies VisitResponse,
      ]);
    });

    test("one visit - no match to exclusive", async () => {
      const testVisit = createTestVisit();
      await updateAndExpect([testVisit], 1, 0, 1);
      await assertVisitCount(db, 1);

      const response = await getResponseFromLambda({
        to: testVisit.latestUpdateTime.toISOString(),
      });
      ExpectResponse.ok(response).expectJson([]);
    });

    test("one visit - no match from", async () => {
      const testVisit = createTestVisit();
      await updateAndExpect([testVisit], 1, 0, 1);
      await assertVisitCount(db, 1);

      const from = addHours(testVisit.latestUpdateTime, 1).toISOString();
      const response = await getResponseFromLambda({ from });
      ExpectResponse.ok(response).expectJson([]);
    });
  }),
);
