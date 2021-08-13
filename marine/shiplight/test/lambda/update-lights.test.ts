import {IDatabase} from "pg-promise";
import {handlerFn} from "../../lib/lambda/update-lights/lambda-update-lights";
import {dbTestBase} from "../../../bridge-lock-disruptions/test/db-testutil";
import {insertAreaTraffic, insertVessel, insertVesselLocation} from "../db-testutil";
import {withMockSecret} from "digitraffic-common/test/secret";
import {ShipTypes} from "../../lib/db/areatraffic";

const updateLights = jest.fn();

describe('update-lights', dbTestBase((db: IDatabase<any, any>) => {
    test('no areas', async () => {
        await handlerFn(withMockSecret, updateLights);

        expect(updateLights).toBeCalledTimes(0);
    });

    test('one area', async () => {
        const duration = 12;
        const areaId = 4;

        await insertAreaTraffic(db, areaId, 'testi1', duration, "POLYGON((0 0, 10 0, 10 10, 0 10, 0 0))");
        await insertVessel(db, 1, ShipTypes.CARGO); // CARGO will trigger
        await insertVesselLocation(db, 1, Date.now(), 1); // x = 1, in the polygon

        await handlerFn(withMockSecret, updateLights);

        expect(updateLights).toBeCalledTimes(1);
        expect(updateLights.mock.calls[0][0].areaId).toEqual(areaId);
        expect(updateLights.mock.calls[0][0].durationInMinutes).toEqual(duration);
    });
}));
