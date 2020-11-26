import * as pgPromise from "pg-promise";
import {handler} from '../../../../lib/lambda/get-disruptions/lambda-get-disruptions';
import {newDisruption} from "../../testdata";
import {dbTestBase, insertDisruption} from "../../db-testutil";

describe('lambda-get-disruptions', dbTestBase((db: pgPromise.IDatabase<any,any>) => {

    test('Get with no extensions', async () => {
        const disruptions = Array.from({length: Math.floor(Math.random() * 10)}).map(() => {
            return newDisruption();
        });
        await insertDisruption(db, disruptions);

        const response = await handler();

        expect(response.features.length).toBe(disruptions.length);
    });

}));