import {IDatabase} from "pg-promise";
import {handlerFn} from "../../lib/lambda/update-lights/lambda-update-lights";
import {dbTestBase} from "../../../bridge-lock-disruptions/test/db-testutil";
import {insertAreaTraffic, insertVessel, insertVesselLocation} from "../db-testutil";

const withSecret = (secretId: string, fn: (secret: any) => Promise<void>) => fn({});
const updateLights = jest.fn();

describe('update-lights', dbTestBase((db: IDatabase<any, any>) => {
    test('no areas', async () => {
        await handlerFn(withSecret, updateLights);

        expect(updateLights).toBeCalledTimes(0);
    });

    test('one area', async () => {
        await insertAreaTraffic(db, 1, 'testi1', 10, "POLYGON((0 0, 10 0, 10 10, 0 10, 0 0))");
        await insertVessel(db, 1, 70); // 70 will trigger
        await insertVesselLocation(db, 1, Date.now(), 1); // x = 1, in the polygon

        await handlerFn(withSecret, updateLights);

        expect(updateLights).toBeCalledTimes(1);
    });
}));
