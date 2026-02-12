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
        fromDateTime: testVisit.latestUpdateTime.toISOString(),
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
        toDateTime: testVisit.latestUpdateTime.toISOString(),
      });
      ExpectResponse.ok(response).expectJson([]);
    });

    test("one visit - no match from", async () => {
      const testVisit = createTestVisit();
      await updateAndExpect([testVisit], 1, 0, 1);
      await assertVisitCount(db, 1);

      const from = addHours(testVisit.latestUpdateTime, 1).toISOString();
      const response = await getResponseFromLambda({ fromDateTime: from });
      ExpectResponse.ok(response).expectJson([]);
    });

    // portOfCall filter tests

    test("filter by portOfCall - match", async () => {
      const visit1 = createTestVisit("V1", "FIHEL");
      const visit2 = createTestVisit("V2", "FIHKG");
      await updateAndExpect([visit1, visit2], 2, 0, 2);

      const response = await getResponseFromLambda({ portOfCall: "FIHEL" });
      ExpectResponse.ok(response).expectContent((visits: VisitResponse[]) => {
        expect(visits).toHaveLength(1);
        expect(visits[0]!.portLocode).toBe("FIHEL");
      });
    });

    test("filter by portOfCall - lowercase input is uppercased", async () => {
      const visit = createTestVisit("V1", "FIHEL");
      await updateAndExpect([visit], 1, 0, 1);

      const response = await getResponseFromLambda({ portOfCall: "fihel" });
      ExpectResponse.ok(response).expectContent((visits: VisitResponse[]) => {
        expect(visits).toHaveLength(1);
        expect(visits[0]!.portLocode).toBe("FIHEL");
      });
    });

    test("filter by portOfCall - no match", async () => {
      const visit = createTestVisit("V1", "FIHEL");
      await updateAndExpect([visit], 1, 0, 1);

      const response = await getResponseFromLambda({ portOfCall: "FIHKG" });
      ExpectResponse.ok(response).expectJson([]);
    });

    // shipName filter tests

    test("filter by shipName - exact match", async () => {
      const visit1 = createTestVisit("V1", "PORT1", "Queen Mary");
      const visit2 = createTestVisit("V2", "PORT1", "Viking Grace");
      await updateAndExpect([visit1, visit2], 2, 0, 2);

      const response = await getResponseFromLambda({ shipName: "Queen Mary" });
      ExpectResponse.ok(response).expectContent((visits: VisitResponse[]) => {
        expect(visits).toHaveLength(1);
        expect(visits[0]!.vesselName).toBe("Queen Mary");
      });
    });

    test("filter by shipName - partial match", async () => {
      const visit1 = createTestVisit("V1", "PORT1", "Queen Mary 2");
      const visit2 = createTestVisit("V2", "PORT1", "Viking Grace");
      await updateAndExpect([visit1, visit2], 2, 0, 2);

      const response = await getResponseFromLambda({ shipName: "Queen" });
      ExpectResponse.ok(response).expectContent((visits: VisitResponse[]) => {
        expect(visits).toHaveLength(1);
        expect(visits[0]!.vesselName).toBe("Queen Mary 2");
      });
    });

    test("filter by shipName - case insensitive", async () => {
      const visit = createTestVisit("V1", "PORT1", "Queen Mary");
      await updateAndExpect([visit], 1, 0, 1);

      const response = await getResponseFromLambda({ shipName: "queen mary" });
      ExpectResponse.ok(response).expectContent((visits: VisitResponse[]) => {
        expect(visits).toHaveLength(1);
        expect(visits[0]!.vesselName).toBe("Queen Mary");
      });
    });

    test("filter by shipName - no match", async () => {
      const visit = createTestVisit("V1", "PORT1", "Queen Mary");
      await updateAndExpect([visit], 1, 0, 1);

      const response = await getResponseFromLambda({ shipName: "Viking" });
      ExpectResponse.ok(response).expectJson([]);
    });

    // imo filter tests

    test("filter by imo - match", async () => {
      const visit1 = createTestVisit("V1", "PORT1", "Ship A", "1234567");
      const visit2 = createTestVisit("V2", "PORT1", "Ship B", "7654321");
      await updateAndExpect([visit1, visit2], 2, 0, 2);

      const response = await getResponseFromLambda({ imo: "1234567" });
      ExpectResponse.ok(response).expectContent((visits: VisitResponse[]) => {
        expect(visits).toHaveLength(1);
        expect(visits[0]!.vesselId).toBe("1234567");
      });
    });

    test("filter by imo - no match", async () => {
      const visit = createTestVisit("V1", "PORT1", "Ship A", "1234567");
      await updateAndExpect([visit], 1, 0, 1);

      const response = await getResponseFromLambda({ imo: "9999999" });
      ExpectResponse.ok(response).expectJson([]);
    });

    // status filter tests

    test("filter by status - match arrived", async () => {
      const visit1 = createTestVisit(
        "V1",
        "PORT1",
        "Ship A",
        "1234567",
        "Arrived",
      );
      const visit2 = createTestVisit(
        "V2",
        "PORT1",
        "Ship B",
        "7654321",
        "Departed",
      );
      await updateAndExpect([visit1, visit2], 2, 0, 2);

      const response = await getResponseFromLambda({ status: "arrived" });
      ExpectResponse.ok(response).expectContent((visits: VisitResponse[]) => {
        expect(visits).toHaveLength(1);
        expect(visits[0]!.status).toBe("Arrived");
      });
    });

    test("filter by status - match expected-to-arrive", async () => {
      const visit1 = createTestVisit(
        "V1",
        "PORT1",
        "Ship A",
        "1234567",
        "Expected to Arrive",
      );
      const visit2 = createTestVisit(
        "V2",
        "PORT1",
        "Ship B",
        "7654321",
        "Arrived",
      );
      await updateAndExpect([visit1, visit2], 2, 0, 2);

      const response = await getResponseFromLambda({
        status: "expected-to-arrive",
      });
      ExpectResponse.ok(response).expectContent((visits: VisitResponse[]) => {
        expect(visits).toHaveLength(1);
        expect(visits[0]!.status).toBe("Expected to Arrive");
      });
    });

    test("filter by status - no match", async () => {
      const visit = createTestVisit(
        "V1",
        "PORT1",
        "Ship A",
        "1234567",
        "Arrived",
      );
      await updateAndExpect([visit], 1, 0, 1);

      const response = await getResponseFromLambda({ status: "cancelled" });
      ExpectResponse.ok(response).expectJson([]);
    });

    test("filter by status - invalid value returns 400", async () => {
      const response = await getResponseFromLambda({
        status: "invalid-status",
      });
      ExpectResponse.badRequest(response);
    });

    // combined filter tests

    test("filter by portOfCall and status", async () => {
      const visit1 = createTestVisit(
        "V1",
        "FIHEL",
        "Ship A",
        "1111111",
        "Arrived",
      );
      const visit2 = createTestVisit(
        "V2",
        "FIHEL",
        "Ship B",
        "2222222",
        "Departed",
      );
      const visit3 = createTestVisit(
        "V3",
        "FIHKG",
        "Ship C",
        "3333333",
        "Arrived",
      );
      await updateAndExpect([visit1, visit2, visit3], 3, 0, 3);

      const response = await getResponseFromLambda({
        portOfCall: "FIHEL",
        status: "arrived",
      });
      ExpectResponse.ok(response).expectContent((visits: VisitResponse[]) => {
        expect(visits).toHaveLength(1);
        expect(visits[0]!.portLocode).toBe("FIHEL");
        expect(visits[0]!.status).toBe("Arrived");
      });
    });

    test("filter by shipName and imo", async () => {
      const visit1 = createTestVisit("V1", "PORT1", "Queen Mary", "1111111");
      const visit2 = createTestVisit(
        "V2",
        "PORT1",
        "Queen Elizabeth",
        "2222222",
      );
      await updateAndExpect([visit1, visit2], 2, 0, 2);

      const response = await getResponseFromLambda({
        shipName: "Queen",
        imo: "1111111",
      });
      ExpectResponse.ok(response).expectContent((visits: VisitResponse[]) => {
        expect(visits).toHaveLength(1);
        expect(visits[0]!.vesselName).toBe("Queen Mary");
        expect(visits[0]!.vesselId).toBe("1111111");
      });
    });
  }),
);
