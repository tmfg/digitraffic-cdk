import {dbTestBase} from "../db-testutil";
import {DTDatabase} from "digitraffic-common/database/database";
import * as sinon from "sinon";
import * as utils from "../../lib/service/utils";

const DOMAIN = 'my-domain';
const VEHICLE_TYPE = 'my-vehicle-type';
const CONTRACT_ID = 'my-contract-1';

const HARJA_BRUSHING = 'BRUSHING';
const HARJA_PAVING = 'PAVING';
const HARJA_SALTING = 'SALTING';


describe('UtilsTests', dbTestBase((db: DTDatabase) => {

    afterEach(() => {
        sinon.restore();
    });

    test('createHarjaId', async () => {
        const id : BigInt = utils.createHarjaId('3330de39-9d1d-457b-a6fd-a800cf6e7f99');
        expect(id).toBe(BigInt('365522198665597071'));
    });

    test('createHarjaIdNotEqual', async () => {
        const id1 : BigInt = utils.createHarjaId('3330de39-9d1d-457b-a6fd-a800cf6e7f99');
        const id2 : BigInt = utils.createHarjaId('3330de39-9d1d-457b-a6fd-a800cf6e7f98');
        expect(id1).not.toEqual(id2);
    });

}));

