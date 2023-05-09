import { Feature, Geometry } from "geojson";

export interface DbFault {
    readonly id: number;
    readonly entry_timestamp: Date;
    // eslint-disable-next-line @rushstack/no-new-null
    readonly fixed_timestamp: Date | null;
    readonly aton_fault_type: string;
    readonly domain: string;
    readonly state: FaultState;
    readonly fixed: boolean;
    readonly aton_id: number;
    readonly aton_name_fi: string;
    readonly aton_name_sv: string;
    readonly aton_type: string;
    readonly fairway_number: number;
    readonly fairway_name_fi: string;
    readonly fairway_name_sv: string;
    readonly area_number: number;
    readonly area_description: string;
    readonly geometry: string;
}

export enum FaultState {
    Avoin = "Avoin",
    Kirjattu = "Kirjattu",
    Peruttu = "Peruttu",
    Korjattu = "Korjattu",
    Aiheeton = "Aiheeton"
}

export interface AtonProperties {
    readonly ID: number;
    readonly FAULT_TYPE: string;
    // eslint-disable-next-line @rushstack/no-new-null
    readonly FAULT_ENTRY_TIMESTAMP: string | null;
    // eslint-disable-next-line @rushstack/no-new-null
    readonly FAULT_FIXED_TIMESTAMP: string | null;
    readonly FAULT_STATE: string;
    readonly FAULT_FIXED: number;

    readonly TL_NUMERO: number;
    readonly TL_NIMI_SE: string;
    readonly TL_NIMI_FI: string;
    readonly TL_TYYPPI_FI: string;

    readonly VAYLA_JNRO: number;
    readonly VAYLA_NIMI_FI: string;
    readonly VAYLA_NIMI_SE: string;

    readonly MERIALUE_NRO: number;
}

export type FaultFeature = Feature<Geometry, AtonProperties>;
