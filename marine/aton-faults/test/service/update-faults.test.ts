import {assertFaultCount, dbTestBase} from "../db-testutil";
import {DTDatabase} from "digitraffic-common/database/database";
import * as UpdateFaultsService from "../../lib/service/update-faults";
import * as sinon from "sinon";
import {FaultsApi} from "../../lib/api/faults";
import {Feature} from "geojson";

const sandbox = sinon.createSandbox();
const FAULT_DOMAIN = 'C_NA';

const FAULT_KIRJATTU : Feature = {
    type: 'Feature',
    geometry: {
        type: "Point",
        coordinates: [],
    },
    properties: {
        FAULT_TYPE: 'Kirjattu',
    },
};

const FAULT_OK : Feature = {
    type: 'Feature',
    geometry: {
        type: "Point",
        coordinates: [10, 10],
    },
    properties: {
        "ID":-2139947340,
        "FAULT_ENTRY_TIMESTAMP":"2022-03-10 02:53:21",
        "FAULT_FIXED_TIMESTAMP":null,
        "FAULT_UTS":"2022-03-13 19:47:52",
        "FAULT_STATE":"Avoin",
        "FAULT_TYPE":"Valo pimeä",
        "TL_NUMERO":75356,
        "TL_NIMI_FI":"H 10",
        "TL_NIMI_SE":"H 10",
        "TL_TYYPPI_FI":"Poiju",
        "TL_TYYPPI_SE":"Boj","VAYLA_JNRO":5507,
        "VAYLA_NIMI_FI":"Haminan 12m väylä",
        "VAYLA_NIMI_SE":"Haminan 12m väylä",
        "VAYLA_SELOSTE":"Eteläisempi haara Kivileton lounaispuolelta ja pohjoisempi haara Rankin Kivikarin lounaispuolelta",
        "MERIALUE_NRO":5,
        "MERIALUE_SELITYS_FI":"Suomenlahti",
        "MERIALUE_SELITYS_SE":"Finska viken",
        "FAULT_FIXED":0,
    },
};

describe('update-faults', dbTestBase((db: DTDatabase) => {
    afterEach(() => sandbox.restore());

    test('updateFaults - no faults', async () => {
        assertFaultCount(db, 0);
        sandbox.stub(FaultsApi.prototype, 'getFaults').resolves([]);

        await UpdateFaultsService.updateFaults('', FAULT_DOMAIN);

        assertFaultCount(db, 0);
    });

    test('updateFaults - 1 fault - Kirjattu', async () => {
        assertFaultCount(db, 0);
        sandbox.stub(FaultsApi.prototype, 'getFaults').resolves([FAULT_KIRJATTU]);

        await UpdateFaultsService.updateFaults('', FAULT_DOMAIN);

        assertFaultCount(db, 0);
    });

    test('updateFaults - 1 fault', async () => {
        assertFaultCount(db, 0);
        sandbox.stub(FaultsApi.prototype, 'getFaults').resolves([FAULT_OK]);

        await UpdateFaultsService.updateFaults('', FAULT_DOMAIN);

        assertFaultCount(db, 1);
    });
}));
