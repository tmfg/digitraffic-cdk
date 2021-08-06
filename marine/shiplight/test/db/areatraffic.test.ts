import {IDatabase} from "pg-promise";
import {dbTestBase} from "../db-testutil";
import {getAreaTraffic} from "../../lib/db/areatraffic";

describe('db-areatraffic', dbTestBase((db: IDatabase<any, any>) => {
    test('getAreaTraffic - empty', async () => {
        const traffic = await getAreaTraffic(db);

        expect(traffic).toHaveLength(0);
    });
}));
