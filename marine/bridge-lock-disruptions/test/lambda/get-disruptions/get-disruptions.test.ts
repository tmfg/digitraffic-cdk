import * as pgPromise from "pg-promise";
import {handlerFn} from '../../../lib/lambda/get-disruptions/get-disruptions';
import {newDisruption} from "../../testdata";
import {dbTestBase, insertDisruption} from "../../db-testutil";
import {createEmptySecretFunction} from "digitraffic-common/test/secret";
import {FeatureCollection} from "geojson";
import {LambdaResponse} from "digitraffic-common/lambda/lambda-response";

describe('lambda-get-disruptions', dbTestBase((db: pgPromise.IDatabase<any,any>) => {

    test('Get disruptions', async () => {
        const disruptions = Array.from({length: Math.floor(Math.random() * 10)}).map(() => {
            return newDisruption();
        });
        await insertDisruption(db, disruptions);

        const response = await handlerFn(createEmptySecretFunction<FeatureCollection>());
        const responseFeatureCollection = JSON.parse(response.body) as FeatureCollection;

        expect(responseFeatureCollection.features.length).toBe(disruptions.length);
    });

}));
