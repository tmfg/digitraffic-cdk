import {FaultProps} from "../../lib/service/faults";
import * as FaultsService from "../../lib/service/faults";
import {newFault} from "../testdata";
import {dbTestBase, insert, validateS124} from "../db-testutil";
import {Language} from "@digitraffic/common/types/language";
import {DTDatabase} from "@digitraffic/common/database/database";

// XML validation takes a while
jest.setTimeout(30000);

describe('faults', dbTestBase((db: DTDatabase) => {

    test('getFaults124ById - not found', async () => {
        const nullFault = await FaultsService.getFaultS124ById(db, 666);
        expect(nullFault).toBeNull();
    });

    test('getFaultS124ById creates valid XML', async () => {
        const fault = newFault({
            geometry: {
                lat: 60.285807,
                lon: 27.321659,
            },
        });
        await insert(db, [fault]);

        const faultS124 = await FaultsService.getFaultS124ById(db, fault.id);

        if (!faultS124) {
            throw new Error('empty');
        }

        console.info(faultS124);

        await validateS124(faultS124);
    });

    test('findAllFaults', async () => {
        const fault = newFault();
        await insert(db, [fault]);

        const faults = await FaultsService.findAllFaults(Language.FI, 10);

        expect(faults.features.length).toBe(1);
        const props = faults.features[0].properties as FaultProps;
        expect(props.id).toBe(fault.id);
        expect(props.area_number).toBe(fault.area_number);
        expect(props.aton_id).toBe(fault.aton_id);
        expect(props.domain).toBe(fault.domain);
        expect(props.entry_timestamp?.toISOString()).toBe(fault.entry_timestamp.toISOString());
        expect(props.fixed_timestamp?.toISOString()).toBe(fault.fixed_timestamp?.toISOString());
        expect(props.fairway_number).toBe(fault.fairway_number);
        expect(props.state).toBe(fault.state);
        expect(props.type).toBe(fault.aton_fault_type);
        expect(props.aton_type).toBe(fault.aton_type);
    });
}));
