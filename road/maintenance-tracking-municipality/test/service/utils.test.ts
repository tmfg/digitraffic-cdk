import {dbTestBase} from "../db-testutil";
import * as utils from "../../lib/service/utils";

describe('UtilsTests', dbTestBase(() => {

    test('createHarjaId', async () => {
        const id : bigint = utils.createHarjaId('3330de39-9d1d-457b-a6fd-a800cf6e7f99');
        expect(id).toBe(BigInt('365522198665597071').valueOf());
    });

    test('createHarjaIdNotEqual', async () => {
        const id1 : bigint = utils.createHarjaId('3330de39-9d1d-457b-a6fd-a800cf6e7f99');
        const id2 : bigint = utils.createHarjaId('3330de39-9d1d-457b-a6fd-a800cf6e7f98');
        expect(id1).not.toEqual(id2);
    });

}));

