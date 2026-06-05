import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { describe, expect, test } from "vitest";
import * as VisitsDAO from "../../db/visits.js";
import { assertVisitCount, dbTestBase } from "../db-testutil.js";
import { createTestVisit, createTestVisitWith } from "../testdata.js";

function hoursFromNow(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

describe(
  "visits-dao-tests",
  dbTestBase((db: DTDatabase) => {
    test("no visits", async () => {
      const visits = await VisitsDAO.findAllVisits(
        db,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
      );
      expect(visits.length).toBe(0);

      await assertVisitCount(db, 0);
    });

    test("insert one", async () => {
      const update = await VisitsDAO.upsertVisit(db, createTestVisit());
      expect(update.inserted).toBe(1);
      expect(update.updated).toBe(0);

      await assertVisitCount(db, 1);
    });

    describe("upsertVisits", () => {
      test("inserts multiple visits sequentially without concurrent query error", async () => {
        const visits = Array.from({ length: 10 }, (_, i) =>
          createTestVisitWith({ visitId: `BATCH_V${i}` }),
        );

        const result = await VisitsDAO.upsertVisits(db, visits);

        expect(result.inserted).toBe(10);
        expect(result.updated).toBe(0);
        await assertVisitCount(db, 10);
      });

      test("upsertVisits counts inserts and updates correctly", async () => {
        const visit1 = createTestVisitWith({
          visitId: "UV1",
          status: "Expected to Arrive",
        });
        const visit2 = createTestVisitWith({ visitId: "UV2" });

        // First batch: two inserts
        const first = await VisitsDAO.upsertVisits(db, [visit1, visit2]);
        expect(first.inserted).toBe(2);
        expect(first.updated).toBe(0);

        // Second batch: UV1 status changes (triggers DO UPDATE WHERE), UV2 unchanged
        const visit1Updated = createTestVisitWith({
          visitId: "UV1",
          status: "Arrived",
        });
        const second = await VisitsDAO.upsertVisits(db, [
          visit1Updated,
          visit2,
        ]);
        expect(second.inserted).toBe(0);
        expect(second.updated).toBe(1); // only UV1 status changed
        await assertVisitCount(db, 2);
      });

      test("empty response returns zero counts", async () => {
        const result = await VisitsDAO.upsertVisits(db, []);
        expect(result.inserted).toBe(0);
        expect(result.updated).toBe(0);
      });
    });

    describe("from/to filtering", () => {
      test("no from/to returns all visits", async () => {
        await VisitsDAO.upsertVisit(
          db,
          createTestVisitWith({ visitId: "V1", eta: hoursFromNow(1) }),
        );
        await VisitsDAO.upsertVisit(
          db,
          createTestVisitWith({ visitId: "V2", eta: hoursFromNow(2) }),
        );

        const visits = await VisitsDAO.findAllVisits(db);
        expect(visits.length).toBe(2);
      });

      test("match by eta in range", async () => {
        await VisitsDAO.upsertVisit(
          db,
          createTestVisitWith({ visitId: "V1", eta: hoursFromNow(5) }),
        );

        const visits = await VisitsDAO.findAllVisits(
          db,
          hoursFromNow(4),
          hoursFromNow(6),
        );
        expect(visits.length).toBe(1);
        expect(visits[0]!.visit_id).toBe("V1");
      });

      test("match by etd in range", async () => {
        await VisitsDAO.upsertVisit(
          db,
          createTestVisitWith({
            visitId: "V1",
            eta: hoursFromNow(-100),
            etd: hoursFromNow(5),
          }),
        );

        const visits = await VisitsDAO.findAllVisits(
          db,
          hoursFromNow(4),
          hoursFromNow(6),
        );
        expect(visits.length).toBe(1);
        expect(visits[0]!.visit_id).toBe("V1");
      });

      test("match by ata in range", async () => {
        await VisitsDAO.upsertVisit(
          db,
          createTestVisitWith({
            visitId: "V1",
            eta: hoursFromNow(-100),
            ata: hoursFromNow(5),
          }),
        );

        const visits = await VisitsDAO.findAllVisits(
          db,
          hoursFromNow(4),
          hoursFromNow(6),
        );
        expect(visits.length).toBe(1);
        expect(visits[0]!.visit_id).toBe("V1");
      });

      test("match by atd in range", async () => {
        await VisitsDAO.upsertVisit(
          db,
          createTestVisitWith({
            visitId: "V1",
            eta: hoursFromNow(-100),
            atd: hoursFromNow(5),
          }),
        );

        const visits = await VisitsDAO.findAllVisits(
          db,
          hoursFromNow(4),
          hoursFromNow(6),
        );
        expect(visits.length).toBe(1);
        expect(visits[0]!.visit_id).toBe("V1");
      });

      test("no match when all timestamps outside range", async () => {
        await VisitsDAO.upsertVisit(
          db,
          createTestVisitWith({
            visitId: "V1",
            eta: hoursFromNow(-10),
            etd: hoursFromNow(-8),
            ata: hoursFromNow(-9),
            atd: hoursFromNow(-7),
          }),
        );

        const visits = await VisitsDAO.findAllVisits(
          db,
          hoursFromNow(1),
          hoursFromNow(10),
        );
        expect(visits.length).toBe(0);
      });

      test("from only - matches visit with eta >= from", async () => {
        await VisitsDAO.upsertVisit(
          db,
          createTestVisitWith({ visitId: "V1", eta: hoursFromNow(5) }),
        );
        await VisitsDAO.upsertVisit(
          db,
          createTestVisitWith({ visitId: "V2", eta: hoursFromNow(-100) }),
        );

        const visits = await VisitsDAO.findAllVisits(db, hoursFromNow(1));
        expect(visits.length).toBe(1);
        expect(visits[0]!.visit_id).toBe("V1");
      });

      test("to only - matches visit with eta < to", async () => {
        await VisitsDAO.upsertVisit(
          db,
          createTestVisitWith({ visitId: "V1", eta: hoursFromNow(1) }),
        );
        await VisitsDAO.upsertVisit(
          db,
          createTestVisitWith({ visitId: "V2", eta: hoursFromNow(100) }),
        );

        const visits = await VisitsDAO.findAllVisits(
          db,
          undefined,
          hoursFromNow(50),
        );
        expect(visits.length).toBe(1);
        expect(visits[0]!.visit_id).toBe("V1");
      });

      test("to is exclusive", async () => {
        const exactTime = hoursFromNow(5);
        await VisitsDAO.upsertVisit(
          db,
          createTestVisitWith({ visitId: "V1", eta: exactTime }),
        );

        const visits = await VisitsDAO.findAllVisits(
          db,
          hoursFromNow(4),
          exactTime,
        );
        expect(visits.length).toBe(0);
      });

      test("from is inclusive", async () => {
        const exactTime = hoursFromNow(5);
        await VisitsDAO.upsertVisit(
          db,
          createTestVisitWith({ visitId: "V1", eta: exactTime }),
        );

        const visits = await VisitsDAO.findAllVisits(
          db,
          exactTime,
          hoursFromNow(6),
        );
        expect(visits.length).toBe(1);
      });

      test("match when only one of multiple timestamps is in range", async () => {
        await VisitsDAO.upsertVisit(
          db,
          createTestVisitWith({
            visitId: "V1",
            eta: hoursFromNow(-100),
            etd: hoursFromNow(-80),
            ata: hoursFromNow(5),
            atd: hoursFromNow(-60),
          }),
        );

        const visits = await VisitsDAO.findAllVisits(
          db,
          hoursFromNow(4),
          hoursFromNow(6),
        );
        expect(visits.length).toBe(1);
        expect(visits[0]!.visit_id).toBe("V1");
      });

      test("multiple visits - returns only matching ones", async () => {
        await VisitsDAO.upsertVisit(
          db,
          createTestVisitWith({ visitId: "V1", eta: hoursFromNow(5) }),
        );
        await VisitsDAO.upsertVisit(
          db,
          createTestVisitWith({ visitId: "V2", eta: hoursFromNow(50) }),
        );
        await VisitsDAO.upsertVisit(
          db,
          createTestVisitWith({
            visitId: "V3",
            eta: hoursFromNow(-100),
            atd: hoursFromNow(5),
          }),
        );

        const visits = await VisitsDAO.findAllVisits(
          db,
          hoursFromNow(4),
          hoursFromNow(6),
        );
        expect(visits.length).toBe(2);
        const ids = visits.map((v) => v.visit_id).sort();
        expect(ids).toEqual(["V1", "V3"]);
      });

      test("visit with only eta set and null etd/ata/atd matches on eta", async () => {
        await VisitsDAO.upsertVisit(
          db,
          createTestVisitWith({ visitId: "V1", eta: hoursFromNow(5) }),
        );

        const visits = await VisitsDAO.findAllVisits(
          db,
          hoursFromNow(4),
          hoursFromNow(6),
        );
        expect(visits.length).toBe(1);
      });
    });
  }),
);
