import {dbTestBase, insert} from "../../db-testutil";
import * as pgPromise from "pg-promise";
import {newEstimate} from "../../testdata";
import {
    findAllEstimates, saveEstimate, saveEstimates
} from "../../../../lib/estimates/service/estimates";

describe('estimates', dbTestBase((db: pgPromise.IDatabase<any, any>) => {

    test('findAllEstimates - locode', async () => {
        const estimate = newEstimate();
        await insert(db, [estimate]);

        const estimates = await findAllEstimates(estimate.location.port, undefined, undefined);

        expect(estimates.length).toBe(1);
        expect(estimates[0]).toMatchObject(estimate);
    });

    test('findAllEstimates - mmsi', async () => {
        const estimate = newEstimate();
        await insert(db, [estimate]);

        const estimates = await findAllEstimates(undefined, estimate.ship.mmsi, undefined);

        expect(estimates.length).toBe(1);
        expect(estimates[0]).toMatchObject(estimate);
    });

    test('findAllEstimates - imo', async () => {
        const estimate = newEstimate();
        await insert(db, [estimate]);

        const estimates = await findAllEstimates(undefined, undefined, estimate.ship.imo);

        expect(estimates.length).toBe(1);
        expect(estimates[0]).toMatchObject(estimate);
    });

    test('saveEstimate - no conflict returns updated', async () => {
        const estimate = newEstimate();

        const ret = await saveEstimate(estimate);

        expect(ret?.location_locode).toBe(estimate.location.port);
        expect(ret?.ship_mmsi).toBe(estimate.ship.mmsi);
        expect(ret?.ship_imo).toBe(estimate.ship.imo);
    });

    test('saveEstimate - conflict returns undefined', async () => {
        const estimate = newEstimate();

        await saveEstimate(estimate);
        const ret = await saveEstimate(estimate);

        expect(ret).toBeNull();
    });

    test('saveEstimates - multiple updates', async () => {
        const estimate1 = newEstimate();
        const estimate2 = newEstimate();

        const ret = await saveEstimates([estimate1, estimate2]);

        expect(ret[0]?.location_locode).toBe(estimate1.location.port);
        expect(ret[0]?.ship_mmsi).toBe(estimate1.ship.mmsi);
        expect(ret[0]?.ship_imo).toBe(estimate1.ship.imo);

        expect(ret[1]?.location_locode).toBe(estimate2.location.port);
        expect(ret[1]?.ship_mmsi).toBe(estimate2.ship.mmsi);
        expect(ret[1]?.ship_imo).toBe(estimate2.ship.imo);
    });

}));
