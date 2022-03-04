import * as Utils from "../../lib/service/utils";

describe('UtilsTests', () => {

    test('createHarjaId', () => {
        const id : bigint = Utils.createHarjaId('3330de39-9d1d-457b-a6fd-a800cf6e7f99');
        expect(id).toBe(BigInt('365522198665597071').valueOf());
    });

    test('createHarjaIdNotEqual', () => {
        const id1 : bigint = Utils.createHarjaId('3330de39-9d1d-457b-a6fd-a800cf6e7f99');
        const id2 : bigint = Utils.createHarjaId('3330de39-9d1d-457b-a6fd-a800cf6e7f98');
        expect(id1).not.toEqual(id2);
    });

});

