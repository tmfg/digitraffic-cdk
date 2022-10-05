import {handler} from '../../../lib/lambda/get-disruptions/get-disruptions';
import {newDisruption} from "../../testdata";
import {dbTestBase, insertDisruption} from "../../db-testutil";
import {FeatureCollection} from "geojson";
import {ProxyHolder} from "@digitraffic/common/aws/runtime/secrets/proxy-holder";
import * as sinon from "sinon";

describe('lambda-get-disruptions', dbTestBase((db) => {
    sinon.stub(ProxyHolder.prototype, 'setCredentials').returns(Promise.resolve());

    test('Get disruptions', async () => {
        const disruptions = Array.from({length: Math.floor(Math.random() * 10)}).map(() => {
            return newDisruption();
        });
        await insertDisruption(db, disruptions);

        const response = await handler();
        const responseFeatureCollection = JSON.parse(response.body) as FeatureCollection;

        expect(responseFeatureCollection.features.length).toBe(disruptions.length);
    });

}));
