import { assertFaultCount, dbTestBase } from "../db-testutil.js";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import * as UpdateFaultsService from "../../service/update-faults.js";
import { FaultsApi } from "../../api/faults.js";
import type { FaultFeature } from "../../model/fault.js";
import { jest } from "@jest/globals";

const FAULT_DOMAIN = "C_NA";

const FAULT_KIRJATTU: FaultFeature = {
    type: "Feature",
    geometry: {
        type: "Point",
        coordinates: []
    },
    properties: {
        ID: -2139947340,
        FAULT_ENTRY_TIMESTAMP: "2022-03-10 02:53:21",
        FAULT_FIXED_TIMESTAMP: null,
        FAULT_STATE: "Avoin",
        FAULT_TYPE: "Kirjattu",
        TL_NUMERO: 75356,
        TL_NIMI_FI: "H 10",
        TL_NIMI_SE: "H 10",
        TL_TYYPPI_FI: "Poiju",
        VAYLA_JNRO: 5507,
        VAYLA_NIMI_FI: "Haminan 12m väylä",
        VAYLA_NIMI_SE: "Haminan 12m väylä",
        MERIALUE_NRO: 5,
        FAULT_FIXED: 0
    }
};

const FAULT_OK: FaultFeature = {
    type: "Feature",
    geometry: {
        type: "Point",
        coordinates: [10, 10]
    },
    properties: {
        ID: -2139947340,
        FAULT_ENTRY_TIMESTAMP: "2022-03-10 02:53:21",
        FAULT_FIXED_TIMESTAMP: null,
        FAULT_STATE: "Avoin",
        FAULT_TYPE: "Valo pimeä",
        TL_NUMERO: 75356,
        TL_NIMI_FI: "H 10",
        TL_NIMI_SE: "H 10",
        TL_TYYPPI_FI: "Poiju",
        VAYLA_JNRO: 5507,
        VAYLA_NIMI_FI: "Haminan 12m väylä",
        VAYLA_NIMI_SE: "Haminan 12m väylä",
        MERIALUE_NRO: 5,
        FAULT_FIXED: 0
    }
};

describe(
    "update-faults",
    dbTestBase((db: DTDatabase) => {
        test("updateFaults - no faults", async () => {
            await assertFaultCount(db, 0);
            jest.spyOn(FaultsApi.prototype, "getFaults").mockResolvedValue([]);

            await UpdateFaultsService.updateFaults("", FAULT_DOMAIN);

            await assertFaultCount(db, 0);
        });

        test("updateFaults - 1 fault - Kirjattu", async () => {
            await assertFaultCount(db, 0);
            jest.spyOn(FaultsApi.prototype, "getFaults").mockResolvedValue([FAULT_KIRJATTU]);

            await expect(() => UpdateFaultsService.updateFaults("", FAULT_DOMAIN)).rejects.toThrow();

            await assertFaultCount(db, 0);
        });

        test("updateFaults - 1 fault", async () => {
            await assertFaultCount(db, 0);
            jest.spyOn(FaultsApi.prototype, "getFaults").mockResolvedValue([FAULT_OK]);

            await UpdateFaultsService.updateFaults("", FAULT_DOMAIN);

            await assertFaultCount(db, 1);
        });
    })
);
