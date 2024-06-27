import { ImageCategory } from "../api/ocpi/2_1_1/ocpi-api-responses_2_1_1";
import { GeoJsonPoint } from "@digitraffic/common/dist/utils/geojson-types";
import { VersionString } from "../api/ocpi/ocpi-api-responses";

export interface DbTextId {
    readonly id: string;
}

export interface DbInsertedUpdated {
    readonly inserted: number;
    readonly updated: number;
}

export interface DbOcpiCpo {
    readonly dt_cpo_id: string;
    readonly dt_cpo_name: string;
    readonly party_id: string;
    readonly country_code: string;
    readonly token_a: string;
    readonly token_b?: string;
    readonly token_c?: string;
    readonly versions_endpoint: string;
    readonly created: Date;
    readonly modified: Date;
}

export interface DbOcpiCpoBusinessDetailsUpdate {
    readonly dt_cpo_id: string;
    readonly name: string;
    readonly logo_url?: string;
    readonly logo_thumbnail?: string;
    readonly logo_category?: ImageCategory;
    readonly logo_type?: string;
    readonly logo_width?: number;
    readonly logo_height?: number;
    readonly website?: string;
}
export interface DbOcpiCpoBusinessDetails extends DbOcpiCpoBusinessDetailsUpdate {
    readonly created: Date;
    readonly modified: Date;
}

export interface DbOcpiCpoVersionUpdate {
    readonly dt_cpo_id: string;
    readonly ocpi_version: string;
    readonly endpoints_endpoint: string;
}
export interface DbOcpiCpoVersion extends DbOcpiCpoVersionUpdate {
    readonly created: Date;
    readonly modified: Date;
}

export interface DbOcpiCpoModuleEndpointUpdate {
    readonly module: string;
    readonly dt_cpo_id: string;
    readonly ocpi_version: string;
    readonly endpoint: string;
}
export interface DbOcpiCpoModuleEndpoint extends DbOcpiCpoModuleEndpointUpdate {
    readonly created: Date;
    readonly modified: Date;
}

export interface DbOcpiLocationInsert {
    readonly id: string;
    readonly dt_cpo_id: string;
    readonly ocpi_version: string;
    /** location json object as string */
    readonly location_object: object;
    readonly geometry: GeoJsonPoint;
    readonly modified_cpo: Date;
}
export interface DbOcpiLocation extends DbOcpiLocationInsert {
    readonly created: Date;
    readonly modified: Date;
}

export interface CpoLatestVersionEndpoint {
    readonly dtCpoId: string;
    readonly version: VersionString;
    readonly endpoint: string;
}
