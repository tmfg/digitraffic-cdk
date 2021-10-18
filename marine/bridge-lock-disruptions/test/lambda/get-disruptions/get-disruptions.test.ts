import * as pgPromise from "pg-promise";
import {handlerFn} from '../../../lib/lambda/get-disruptions/get-disruptions';
import {newDisruption} from "../../testdata";
import {dbTestBase, insertDisruption} from "../../db-testutil";

describe('lambda-get-disruptions', dbTestBase((db: pgPromise.IDatabase<any,any>) => {

    test('Get disruptions', async () => {
        const disruptions = Array.from({length: Math.floor(Math.random() * 10)}).map(() => {
            return newDisruption();
        });
        await insertDisruption(db, disruptions);

        const response = await handlerFn((secretId: string, fn: (secret: any) => Promise<void>) => fn({}));

        expect(response.features.length).toBe(disruptions.length);
    });

}));
