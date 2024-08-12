import type { FaultProps } from "../../service/faults.js";
import * as FaultsService from "../../service/faults.js";
import { newFault } from "../testdata.js";
import { dbTestBase, insert, validateS124 } from "../db-testutil.js";
import { Language } from "@digitraffic/common/dist/types/language";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import type { Feature, GeoJsonProperties, Geometry } from "geojson";

// XML validation takes a while
//jest.setTimeout(30000);

describe(
    "faults",
    dbTestBase((db: DTDatabase) => {
        test("getFaults124ById - not found", async () => {
            const nullFault = await FaultsService.getFaultS124ById(db, 666);
            expect(nullFault).not.toBeDefined();
        });

        test("getFaultS124ById creates valid XML", async () => {
            const fault = newFault({
                geometry: {
                    lat: 60.285807,
                    lon: 27.321659
                }
            });
            await insert(db, [fault]);

            const faultS124 = await FaultsService.getFaultS124ById(db, fault.id);

            if (!faultS124) {
                throw new Error("empty");
            }

            //console.info(faultS124);

            await validateS124(faultS124);
        });

        test("findAllFaults", async () => {
            const fault = newFault();
            await insert(db, [fault]);

            const [faults] = await FaultsService.findAllFaults(Language.FI, 10);

            expect(faults.features.length).toBe(1);
            const feature = faults.features[0] as unknown as Feature<Geometry, GeoJsonProperties>;
            const props = feature.properties as FaultProps;
            expect(props.id).toBe(fault.id);
            expect(props.area_number).toBe(fault.area_number);
            expect(props.aton_id).toBe(fault.aton_id);
            expect(props.domain).toBe(fault.domain);
            expect(props.entry_timestamp.toISOString()).toBe(fault.entry_timestamp.toISOString());
            expect(props.fixed_timestamp?.toISOString()).toBe(fault.fixed_timestamp?.toISOString());
            expect(props.fairway_number).toBe(fault.fairway_number);
            expect(props.state).toBe(fault.state);
            expect(props.type).toBe(fault.aton_fault_type);
            expect(props.aton_type).toBe(fault.aton_type);
        });
    })
);
