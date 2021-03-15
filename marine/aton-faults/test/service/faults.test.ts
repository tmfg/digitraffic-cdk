import {getFaultS124ById} from "../../lib/service/faults";
import {newFault} from "../testdata";
import {dbTestBase, insert} from "../db-testutil";
import * as pgPromise from "pg-promise";

describe('faults', dbTestBase((db: pgPromise.IDatabase<any, any>) => {

    test('findFaultById creates XML', async () => {
        const fault = newFault({
            geometry: {
                lat: 60.285807,
                lon: 27.321659
            }
        });
        await insert(db, [fault]);

        const faultS124 = await getFaultS124ById(fault.id);

        // TODO expect based on XML structure
        expect(faultS124).toBeTruthy();
    });

}));
