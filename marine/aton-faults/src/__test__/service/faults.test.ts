import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { Language } from "@digitraffic/common/dist/types/language";
import type { Feature, GeoJsonProperties, Geometry } from "geojson";
import type { FaultProps } from "../../service/faults.js";
import * as FaultsService from "../../service/faults.js";
import { dbTestBase, insert } from "../db-testutil.js";
import { newFault } from "../testdata.js";

// XML validation takes a while
//jest.setTimeout(30000);

describe(
  "faults",
  dbTestBase((db: DTDatabase) => {
    test("findAllFaults", async () => {
      const fault = newFault();
      await insert(db, [fault]);

      const [faults] = await FaultsService.findAllFaults(Language.FI, 10);

      expect(faults.features.length).toBe(1);
      const feature = faults.features[0] as unknown as Feature<
        Geometry,
        GeoJsonProperties
      >;
      const props = feature.properties as FaultProps;
      expect(props.id).toBe(fault.id);
      expect(props.area_number).toBe(fault.area_number);
      expect(props.aton_id).toBe(fault.aton_id);
      expect(props.domain).toBe(fault.domain);
      expect(props.entry_timestamp.toISOString()).toBe(
        fault.entry_timestamp.toISOString(),
      );
      expect(props.fixed_timestamp?.toISOString()).toBe(
        fault.fixed_timestamp?.toISOString(),
      );
      expect(props.fairway_number).toBe(fault.fairway_number);
      expect(props.state).toBe(fault.state);
      expect(props.type).toBe(fault.aton_fault_type);
      expect(props.aton_type).toBe(fault.aton_type);
    });
  }),
);
