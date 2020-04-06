import {dbTestBase, insertDisruption} from "../db-testutil";
import * as pgPromise from "pg-promise";
import {disruptionFeatures, newDisruption} from "../testdata";
import {findAllDisruptions, saveDisruptions} from "../../../lib/service/disruptions";
import {findAll} from "../../../lib/db/db-disruptions";

describe('disruptions', dbTestBase((db: pgPromise.IDatabase<any, any>) => {

    test('findAllDisruptions', async () => {
        const disruptions = Array.from({length: Math.floor(Math.random() * 10)}).map(() => {
            return newDisruption();
        });
        await insertDisruption(db, disruptions);

        const fetchedDisruptions = await findAllDisruptions();

        expect(fetchedDisruptions.features.length).toBe(disruptions.length);
    });

    test('saveDisruptions', async () => {
        const features = disruptionFeatures().features;

        await saveDisruptions(features);

        const savedDisruptions = await findAll(db, (d) => d);
        expect(savedDisruptions.length).toBe(features.length);
    });

}));
