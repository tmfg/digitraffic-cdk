import type { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { ExpectResponse } from "@digitraffic-cdk/testing";
import { addHours, subHours } from "date-fns";
import type { VisitResponse } from "../../model/visit-schema.js";
import {
  assertVisitCount,
  dbTestBase,
  mockProxyAndSecretHolder,
} from "../db-testutil.js";
import { updateAndExpect } from "../service/visits-service.test.js";
import { createTestVisit, createTestVisitWith } from "../testdata.js";

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
          portOfCall: testVisit.portCall.voyageInformation.portIdentification,
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
          portOfCall: testVisit.portCall.voyageInformation.portIdentification,
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
        expect(visits[0]!.portOfCall).toBe("FIHEL");
      });
    });

    test("filter by portOfCall - lowercase input is uppercased", async () => {
      const visit = createTestVisit("V1", "FIHEL");
      await updateAndExpect([visit], 1, 0, 1);

      const response = await getResponseFromLambda({ portOfCall: "fihel" });
      ExpectResponse.ok(response).expectContent((visits: VisitResponse[]) => {
        expect(visits).toHaveLength(1);
        expect(visits[0]!.portOfCall).toBe("FIHEL");
      });
    });

    test("filter by portOfCall - no match", async () => {
      const visit = createTestVisit("V1", "FIHEL");
      await updateAndExpect([visit], 1, 0, 1);

      const response = await getResponseFromLambda({ portOfCall: "FIHKG" });
      ExpectResponse.ok(response).expectJson([]);
    });

    // vesselName filter tests

    test("filter by vesselName - exact match", async () => {
      const visit1 = createTestVisit("V1", "PORT1", "Queen Mary");
      const visit2 = createTestVisit("V2", "PORT1", "Viking Grace");
      await updateAndExpect([visit1, visit2], 2, 0, 2);

      const response = await getResponseFromLambda({
        vesselName: "Queen Mary",
      });
      ExpectResponse.ok(response).expectContent((visits: VisitResponse[]) => {
        expect(visits).toHaveLength(1);
        expect(visits[0]!.vesselName).toBe("Queen Mary");
      });
    });

    test("filter by vesselName - partial match", async () => {
      const visit1 = createTestVisit("V1", "PORT1", "Queen Mary 2");
      const visit2 = createTestVisit("V2", "PORT1", "Viking Grace");
      await updateAndExpect([visit1, visit2], 2, 0, 2);

      const response = await getResponseFromLambda({ vesselName: "Queen" });
      ExpectResponse.ok(response).expectContent((visits: VisitResponse[]) => {
        expect(visits).toHaveLength(1);
        expect(visits[0]!.vesselName).toBe("Queen Mary 2");
      });
    });

    test("filter by vesselName - case insensitive", async () => {
      const visit = createTestVisit("V1", "PORT1", "Queen Mary");
      await updateAndExpect([visit], 1, 0, 1);

      const response = await getResponseFromLambda({
        vesselName: "queen mary",
      });
      ExpectResponse.ok(response).expectContent((visits: VisitResponse[]) => {
        expect(visits).toHaveLength(1);
        expect(visits[0]!.vesselName).toBe("Queen Mary");
      });
    });

    test("filter by vesselName - no match", async () => {
      const visit = createTestVisit("V1", "PORT1", "Queen Mary");
      await updateAndExpect([visit], 1, 0, 1);

      const response = await getResponseFromLambda({ vesselName: "Viking" });
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
        expect(visits[0]!.portOfCall).toBe("FIHEL");
        expect(visits[0]!.status).toBe("Arrived");
      });
    });

    test("filter by vesselName and imo", async () => {
      const visit1 = createTestVisit("V1", "PORT1", "Queen Mary", "1111111");
      const visit2 = createTestVisit(
        "V2",
        "PORT1",
        "Queen Elizabeth",
        "2222222",
      );
      await updateAndExpect([visit1, visit2], 2, 0, 2);

      const response = await getResponseFromLambda({
        vesselName: "Queen",
        imo: "1111111",
      });
      ExpectResponse.ok(response).expectContent((visits: VisitResponse[]) => {
        expect(visits).toHaveLength(1);
        expect(visits[0]!.vesselName).toBe("Queen Mary");
        expect(visits[0]!.vesselId).toBe("1111111");
      });
    });

    // sorting tests

    test("results sorted by ETA ascending when no ATA", async () => {
      const now = new Date();
      const visit1 = createTestVisitWith({
        visitId: "V1",
        vesselName: "Late Ship",
        identification: "1111111",
        eta: addHours(now, 3),
      });
      const visit2 = createTestVisitWith({
        visitId: "V2",
        vesselName: "Early Ship",
        identification: "2222222",
        eta: addHours(now, 1),
      });
      const visit3 = createTestVisitWith({
        visitId: "V3",
        vesselName: "Middle Ship",
        identification: "3333333",
        eta: addHours(now, 2),
      });
      await updateAndExpect([visit1, visit2, visit3], 3, 0, 3);

      const response = await getResponseFromLambda();
      ExpectResponse.ok(response).expectContent((visits: VisitResponse[]) => {
        expect(visits).toHaveLength(3);
        expect(visits[0]!.vesselName).toBe("Early Ship");
        expect(visits[1]!.vesselName).toBe("Middle Ship");
        expect(visits[2]!.vesselName).toBe("Late Ship");
      });
    });

    test("results sorted by ATA when available, falling back to ETA", async () => {
      const now = new Date();
      // Ship with ATA earlier than others' ETAs
      const visit1 = createTestVisitWith({
        visitId: "V1",
        vesselName: "Arrived Early",
        identification: "1111111",
        eta: addHours(now, 10),
        ata: subHours(now, 1),
      });
      // Ship with no ATA, sorts by ETA
      const visit2 = createTestVisitWith({
        visitId: "V2",
        vesselName: "Expected Soon",
        identification: "2222222",
        eta: addHours(now, 1),
      });
      // Ship with ATA later than visit2's ETA
      const visit3 = createTestVisitWith({
        visitId: "V3",
        vesselName: "Arrived Late",
        identification: "3333333",
        eta: addHours(now, 5),
        ata: addHours(now, 6),
      });
      await updateAndExpect([visit1, visit2, visit3], 3, 0, 3);

      const response = await getResponseFromLambda();
      ExpectResponse.ok(response).expectContent((visits: VisitResponse[]) => {
        expect(visits).toHaveLength(3);
        // ATA -1h < ETA +1h < ATA +6h
        expect(visits[0]!.vesselName).toBe("Arrived Early");
        expect(visits[1]!.vesselName).toBe("Expected Soon");
        expect(visits[2]!.vesselName).toBe("Arrived Late");
      });
    });

    // sort parameter tests

    test("invalid sort format returns bad request", async () => {
      const response = await getResponseFromLambda({ sort: "invalid" });
      ExpectResponse.badRequest(response);
    });

    test("invalid sort field returns bad request", async () => {
      const response = await getResponseFromLambda({ sort: "foo:asc" });
      ExpectResponse.badRequest(response);
    });

    test("invalid sort direction returns bad request", async () => {
      const response = await getResponseFromLambda({ sort: "eta:up" });
      ExpectResponse.badRequest(response);
    });

    test("sort by eta ascending", async () => {
      const now = new Date();
      const visit1 = createTestVisitWith({
        visitId: "V1",
        vesselName: "Late Ship",
        identification: "1111111",
        eta: addHours(now, 3),
      });
      const visit2 = createTestVisitWith({
        visitId: "V2",
        vesselName: "Early Ship",
        identification: "2222222",
        eta: addHours(now, 1),
      });
      const visit3 = createTestVisitWith({
        visitId: "V3",
        vesselName: "Middle Ship",
        identification: "3333333",
        eta: addHours(now, 2),
      });
      await updateAndExpect([visit1, visit2, visit3], 3, 0, 3);

      const response = await getResponseFromLambda({ sort: "eta:asc" });
      ExpectResponse.ok(response).expectContent((visits: VisitResponse[]) => {
        expect(visits).toHaveLength(3);
        expect(visits[0]!.vesselName).toBe("Early Ship");
        expect(visits[1]!.vesselName).toBe("Middle Ship");
        expect(visits[2]!.vesselName).toBe("Late Ship");
      });
    });

    test("sort by eta descending", async () => {
      const now = new Date();
      const visit1 = createTestVisitWith({
        visitId: "V1",
        vesselName: "Late Ship",
        identification: "1111111",
        eta: addHours(now, 3),
      });
      const visit2 = createTestVisitWith({
        visitId: "V2",
        vesselName: "Early Ship",
        identification: "2222222",
        eta: addHours(now, 1),
      });
      const visit3 = createTestVisitWith({
        visitId: "V3",
        vesselName: "Middle Ship",
        identification: "3333333",
        eta: addHours(now, 2),
      });
      await updateAndExpect([visit1, visit2, visit3], 3, 0, 3);

      const response = await getResponseFromLambda({ sort: "eta:desc" });
      ExpectResponse.ok(response).expectContent((visits: VisitResponse[]) => {
        expect(visits).toHaveLength(3);
        expect(visits[0]!.vesselName).toBe("Late Ship");
        expect(visits[1]!.vesselName).toBe("Middle Ship");
        expect(visits[2]!.vesselName).toBe("Early Ship");
      });
    });

    test("sort by vesselName ascending", async () => {
      const now = new Date();
      const visit1 = createTestVisitWith({
        visitId: "V1",
        vesselName: "Charlie",
        identification: "1111111",
        eta: addHours(now, 1),
      });
      const visit2 = createTestVisitWith({
        visitId: "V2",
        vesselName: "Alpha",
        identification: "2222222",
        eta: addHours(now, 2),
      });
      const visit3 = createTestVisitWith({
        visitId: "V3",
        vesselName: "Bravo",
        identification: "3333333",
        eta: addHours(now, 3),
      });
      await updateAndExpect([visit1, visit2, visit3], 3, 0, 3);

      const response = await getResponseFromLambda({ sort: "vesselName:asc" });
      ExpectResponse.ok(response).expectContent((visits: VisitResponse[]) => {
        expect(visits).toHaveLength(3);
        expect(visits[0]!.vesselName).toBe("Alpha");
        expect(visits[1]!.vesselName).toBe("Bravo");
        expect(visits[2]!.vesselName).toBe("Charlie");
      });
    });

    test("sort by status descending", async () => {
      const now = new Date();
      const visit1 = createTestVisitWith({
        visitId: "V1",
        vesselName: "Ship A",
        identification: "1111111",
        eta: addHours(now, 1),
        status: "Arrived",
      });
      const visit2 = createTestVisitWith({
        visitId: "V2",
        vesselName: "Ship B",
        identification: "2222222",
        eta: addHours(now, 2),
        status: "Expected to Arrive",
      });
      const visit3 = createTestVisitWith({
        visitId: "V3",
        vesselName: "Ship C",
        identification: "3333333",
        eta: addHours(now, 3),
        status: "Departed",
      });
      await updateAndExpect([visit1, visit2, visit3], 3, 0, 3);

      const response = await getResponseFromLambda({ sort: "status:desc" });
      ExpectResponse.ok(response).expectContent((visits: VisitResponse[]) => {
        expect(visits).toHaveLength(3);
        // alphabetical desc: Expected to Arrive > Departed > Arrived
        expect(visits[0]!.vesselName).toBe("Ship B");
        expect(visits[1]!.vesselName).toBe("Ship C");
        expect(visits[2]!.vesselName).toBe("Ship A");
      });
    });

    test("sort by portOfCall ascending", async () => {
      const now = new Date();
      const visit1 = createTestVisitWith({
        visitId: "V1",
        vesselName: "Ship A",
        identification: "1111111",
        eta: addHours(now, 1),
        portIdentification: "FIHEL",
      });
      const visit2 = createTestVisitWith({
        visitId: "V2",
        vesselName: "Ship B",
        identification: "2222222",
        eta: addHours(now, 2),
        portIdentification: "FIANK",
      });
      const visit3 = createTestVisitWith({
        visitId: "V3",
        vesselName: "Ship C",
        identification: "3333333",
        eta: addHours(now, 3),
        portIdentification: "FITUL",
      });
      await updateAndExpect([visit1, visit2, visit3], 3, 0, 3);

      const response = await getResponseFromLambda({ sort: "portOfCall:asc" });
      ExpectResponse.ok(response).expectContent((visits: VisitResponse[]) => {
        expect(visits).toHaveLength(3);
        expect(visits[0]!.portOfCall).toBe("FIANK");
        expect(visits[1]!.portOfCall).toBe("FIHEL");
        expect(visits[2]!.portOfCall).toBe("FITUL");
      });
    });
  }),
);
