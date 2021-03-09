import * as pgPromise from "pg-promise";
import {dbTestBase, insert} from "../db-testutil";
import {newFault} from "../testdata";
import {findFaultsByRoute} from "../../lib/db/db-voyageplan-faults";
import {LineString, Point} from "wkx";

describe('db-voyageplan-faults', dbTestBase((db: pgPromise.IDatabase<any, any>) => {

    test('findFaultsByArea - within 15 nautical miles', async () => {
        const fault = newFault({
            geometry: {
                lat: 27.321659,
                lon: 60.285807
            }
        });
        const route = new LineString([
            new Point(27.029835, 60.474496),
            new Point(27.224842, 60.400138)
        ]);

        await insert(db, [fault]);

        const faults = await findFaultsByRoute(db, route);
        expect(faults.length).toBe(1);
    });

    test('findFaultsByArea - outside range', async () => {
        const fault = newFault({
            geometry: {
                lat: 27.502246,
                lon: 60.177569
            }
        });
        const route = new LineString([
            new Point(27.029835, 60.474496),
            new Point(27.224842, 60.400138)
        ]);

        await insert(db, [fault]);

        const faults = await findFaultsByRoute(db, route);
        expect(faults.length).toBe(0);
    });

}));
