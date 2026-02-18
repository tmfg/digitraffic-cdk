import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { getRandomNumber } from "@digitraffic/common/dist/test/testutils";
import { Language } from "@digitraffic/common/dist/types/language";
import { addHours } from "date-fns";
import { LineString, Point } from "wkx";
import * as FaultsDb from "../../db/faults.js";
import { findAll } from "../../db/faults.js";
import { FaultState } from "../../model/fault.js";
import { dbTestBase, insert } from "../db-testutil.js";
import { newFault } from "../testdata.js";

describe(
  "db-voyageplan-faults",
  dbTestBase((db: DTDatabase) => {
    test("findFaultsByArea - within 15 nautical miles", async () => {
      const fault = newFault({
        geometry: {
          lat: 60.285807,
          lon: 27.321659,
        },
      });
      const route = new LineString([
        new Point(27.024842, 60.524496),
        new Point(27.224842, 59.900138),
      ]);

      await insert(db, [fault]);

      const faults = await FaultsDb.findFaultIdsByRoute(db, route);
      expect(faults.length).toBe(1);
    });

    test("findFaultsByArea - outside range", async () => {
      const fault = newFault({
        geometry: {
          lat: 60.177569,
          lon: 27.502246,
        },
      });
      const route = new LineString([
        new Point(27.029835, 60.474496),
        new Point(27.224842, 60.400138),
      ]);

      await insert(db, [fault]);

      const faults = await FaultsDb.findFaultIdsByRoute(db, route);
      expect(faults.length).toBe(0);
    });

    test("findFaultsByArea - only avoin & kirjattu", async () => {
      const faultAvoin = newFault({
        geometry: {
          lat: 60.474497,
          lon: 27.029836,
        },
        state: FaultState.Avoin,
      });
      const faultKirjattu = newFault({
        geometry: {
          lat: 60.474498,
          lon: 27.029837,
        },
        state: FaultState.Kirjattu,
      });
      const faultAiheeton = newFault({
        geometry: {
          lat: 60.474499,
          lon: 27.029838,
        },
        state: FaultState.Aiheeton,
      });
      const route = new LineString([
        new Point(27.029835, 60.474496),
        new Point(27.224842, 60.400138),
      ]);

      await insert(db, [faultAvoin, faultKirjattu, faultAiheeton]);

      const faultIds = await FaultsDb.findFaultIdsByRoute(db, route);
      expect(faultIds.length).toBe(2);
      expect(faultIds.find((id) => id === faultAvoin.id)).not.toBeNull();
      expect(faultIds.find((id) => id === faultKirjattu.id)).not.toBeNull();
    });

    test("getFaultById - found", async () => {
      const fault = newFault();
      await insert(db, [fault]);

      const foundFault = await FaultsDb.getFaultById(db, fault.id);

      expect(Number(foundFault?.id)).toBe(fault.id);
    });

    test("getFaultById - not found", async () => {
      const fault = newFault();
      await insert(db, [fault]);

      const foundFault = await FaultsDb.getFaultById(db, fault.id + 1);

      expect(foundFault).toBeUndefined();
    });

    test("findAllFaults - empty", async () => {
      const faults = await findAll(db, Language.FI, 0, (f) => f);

      expect(faults.length).toBe(0);
    });

    test("findAllFaults - multiple", async () => {
      const faults = Array.from({ length: getRandomNumber(1, 10) }).map(() =>
        newFault(),
      );
      await insert(db, faults);

      const foundFaults = await findAll(db, Language.FI, 10, (f) => f);

      expect(foundFaults.length).toBe(faults.length);
    });

    test("findAllFaults - fixed in hours", async () => {
      const fault = newFault({
        fixedTimestamp: addHours(Date.now(), 3),
      });
      await insert(db, [fault]);

      const faults = await findAll(db, Language.FI, 2, (f) => f);

      expect(faults.length).toBe(1);
    });
  }),
);
