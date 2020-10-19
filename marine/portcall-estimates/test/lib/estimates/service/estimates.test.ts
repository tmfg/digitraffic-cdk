import {dbTestBase, insert} from "../../db-testutil";
import * as pgPromise from "pg-promise";
import {newEstimate} from "../../testdata";
import {
    findAllEstimates, saveEstimate
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

}));
