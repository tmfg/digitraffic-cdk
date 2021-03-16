import {getFaultS124ById} from "../../lib/service/faults";
import {newFault} from "../testdata";
import {dbTestBase, insert} from "../db-testutil";
import * as pgPromise from "pg-promise";
import * as xsdValidator from 'xsd-schema-validator';

// XML validation takes a while
jest.setTimeout(30000);

describe('faults', dbTestBase((db: pgPromise.IDatabase<any, any>) => {

    test('getFaultS124ById creates valid XML', async (done) => {
        const fault = newFault({
            geometry: {
                lat: 60.285807,
                lon: 27.321659
            }
        });
        await insert(db, [fault]);

        const faultS124 = await getFaultS124ById(fault.id);

        xsdValidator.validateXML(faultS124, 'test/service/S124.xsd', (err, result) => {
            if (err) {
                throw err;
            }
            expect(result.valid).toBe(true);
            done();
        });
    });

}));
