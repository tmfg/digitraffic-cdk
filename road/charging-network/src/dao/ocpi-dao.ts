import { logger, type LoggerMethodType } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import type { DTDatabase, DTTransaction } from "@digitraffic/common/dist/database/database";
import { PreparedStatement } from "pg-promise";
import type {
    DbInsertedUpdated,
    DbOcpiCpo,
    DbOcpiCpoBusinessDetails,
    DbOcpiCpoBusinessDetailsUpdate,
    DbOcpiCpoModuleEndpoint,
    DbOcpiCpoModuleEndpointUpdate,
    DbOcpiCpoVersionUpdate,
    DbOcpiLocation,
    DbOcpiLocationInsert
} from "../model/dao-models.js";
import type { OcpiModule } from "../model/ocpi-constants.js";
import { SRID_WGS84 } from "@digitraffic/common/dist/utils/geometry";
import type { VersionString } from "../api/ocpi/ocpi-api-responses.js";
import type { GeoJsonPoint } from "@digitraffic/common/dist/utils/geojson-types";

const COORDINATE_PRECISION = 0.000001 as const; // What is the precision of saved coordinates
const SERVICE = "OcpiDao" as const;

const PS_SELECT_UNREGISTERED_CPOS = new PreparedStatement({
    name: "PS_SELECT_UNREGISTERED_CPOS",
    text: `select dt_cpo_id, dt_cpo_name, token_a, token_b, token_c, versions_endpoint, created, modified
           from ocpi_cpo
           where token_c is null`
});

export function findUnregisteredCpos(db: DTDatabase): Promise<DbOcpiCpo[]> {
    return db.manyOrNone<DbOcpiCpo>(PS_SELECT_UNREGISTERED_CPOS).catch((error: unknown) => {
        logger.error({
            method: `${SERVICE}.findUnregisteredCpos`,
            message: `failed`,
            error,
            stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
    });
}

const PS_SELECT_REGISTERED_CPOS = new PreparedStatement({
    name: "PS_SELECT_REGISTERED_CPOS",
    text: `select dt_cpo_id, dt_cpo_name, token_a, token_b, token_c, versions_endpoint, created, modified
           from ocpi_cpo
           where token_c is not null`
});

export function findRegisteredCpos(db: DTDatabase): Promise<DbOcpiCpo[]> {
    return db.manyOrNone<DbOcpiCpo>(PS_SELECT_REGISTERED_CPOS).catch((error: unknown) => {
        logger.error({
            method: `${SERVICE}.findRegisteredCpos`,
            message: `failed`,
            error,
            stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
    });
}

const PS_UPSERT_OCPI_TOKEN_B = new PreparedStatement({
    name: "PS_UPSERT_OCPI_TOKEN_B",
    text: `UPDATE ocpi_cpo
           SET token_b = $2
           WHERE dt_cpo_id = $1`
});

export async function upsertTokenB(db: DTDatabase, dtCpoId: string, tokenB: string): Promise<void> {
    return db
        .none(PS_UPSERT_OCPI_TOKEN_B, [dtCpoId, tokenB])
        .then(() => undefined)
        .catch((error: unknown) => {
            logger.error({
                method: `${SERVICE}.upsertTokenB`,
                message: "failed",
                error,
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        });
}

const PS_UPDATE_OCPI_CPO_CREDENTIALS = new PreparedStatement({
    name: "PS_UPDATE_OCPI_CPO_CREDENTIALS",
    text: `UPDATE ocpi_cpo
           SET token_c = $2,
               versions_endpoint = $3,
               party_id = $4,
               country_code = $5
           WHERE dt_cpo_id = $1`
});

export async function updateCpoCredentials(
    db: DTDatabase,
    dtCpoId: string,
    tokenC: string,
    versionsEndpoint: string,
    partyId: string,
    countryCode: string
): Promise<void> {
    return db
        .none(PS_UPDATE_OCPI_CPO_CREDENTIALS, [dtCpoId, tokenC, versionsEndpoint, partyId, countryCode])
        .then(() => undefined)
        .catch((error: unknown) => {
            logger.error({
                method: `${SERVICE}.updateCpoCredentials`,
                message: "failed",
                error,
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        });
}

const PS_UPSERT_OCPI_CPO_BUSINESS_DETAILS = new PreparedStatement({
    name: "PS_UPSERT_OCPI_CPO_BUSINESS_DETAILS",
    text: `INSERT INTO ocpi_cpo_business_details (dt_cpo_id, name, logo_url, logo_thumbnail, logo_category, logo_type, logo_width, logo_height, website)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT ON CONSTRAINT ocpi_cpo_business_details_pkey
           DO UPDATE SET name = EXCLUDED.name,
                         logo_url = EXCLUDED.logo_url,
                         logo_thumbnail = EXCLUDED.logo_thumbnail,
                         logo_category = EXCLUDED.logo_category,
                         logo_type = EXCLUDED.logo_type,
                         logo_width = EXCLUDED.logo_width,
                         logo_height = EXCLUDED.logo_height,
                         website = EXCLUDED.website`
});

export async function upsertCpoBusinessDetails(
    db: DTDatabase,
    bd: DbOcpiCpoBusinessDetailsUpdate
): Promise<void> {
    return db
        .none(PS_UPSERT_OCPI_CPO_BUSINESS_DETAILS, [
            bd.dt_cpo_id,
            bd.name,
            bd.logo_url,
            bd.logo_thumbnail,
            bd.logo_category,
            bd.logo_type,
            bd.logo_width,
            bd.logo_height,
            bd.website
        ])
        .then(() => undefined)
        .catch((error: unknown) => {
            logger.error({
                method: `${SERVICE}.upsertCpoBusinessDetails`,
                message: "failed",
                error,
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        });
}

const PS_UPSERT_OCPI_CPO_VERSION = new PreparedStatement({
    name: "PS_UPSERT_OCPI_CPO_VERSION",
    text: `INSERT INTO ocpi_cpo_version (dt_cpo_id, ocpi_version, endpoints_endpoint)
           VALUES ($1, $2, $3)
    ON CONFLICT ON CONSTRAINT ocpi_cpo_version_pkey
        DO UPDATE SET endpoints_endpoint = EXCLUDED.endpoints_endpoint`
});

export async function upsertCpoVersion(db: DTDatabase, cpo: DbOcpiCpoVersionUpdate): Promise<void> {
    return db
        .none(PS_UPSERT_OCPI_CPO_VERSION, [cpo.dt_cpo_id, cpo.ocpi_version, cpo.endpoints_endpoint])
        .then(() => undefined)
        .catch((error: unknown) => {
            logger.error({
                method: `${SERVICE}.upsertCpoVersion`,
                message: "failed",
                error,
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        });
}

const PS_SELECT_OCPI_CPO = new PreparedStatement({
    name: "PS_SELECT_OCPI_CPO",
    text: `select dt_cpo_id, dt_cpo_name, token_a, token_b, token_c, versions_endpoint, party_id, country_code, created, modified
           from ocpi_cpo
           where dt_cpo_id = $1`
});
export function findCpo(db: DTDatabase, dtCpoId: string): Promise<DbOcpiCpo | undefined> {
    return db
        .oneOrNone<DbOcpiCpo | undefined>(PS_SELECT_OCPI_CPO, [dtCpoId])
        .then((value) => (value ? value : undefined))
        .catch((error: unknown) => {
            logger.error({
                method: `${SERVICE}.findCpo`,
                message: "failed",
                error,
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        });
}

const PS_SELECT_OCPI_CPO_BUSINESS_DETAILS = new PreparedStatement({
    name: "PS_SELECT_OCPI_CPO_BUSINESS_DETAILS",
    text: `select dt_cpo_id, name, logo_url, logo_thumbnail, logo_category, logo_type, logo_width, logo_height, website, created, modified
           from ocpi_cpo_business_details
           where dt_cpo_id = $1`
});
export function findCpoBusinessDetails(
    db: DTDatabase,
    dtCpoId: string
): Promise<DbOcpiCpoBusinessDetails | undefined> {
    return db
        .oneOrNone<DbOcpiCpoBusinessDetails | undefined>(PS_SELECT_OCPI_CPO_BUSINESS_DETAILS, [dtCpoId])
        .then((value) => (value ? value : undefined))
        .catch((error: unknown) => {
            logger.error({
                method: `${SERVICE}.findCpoBusinessDetails`,
                message: "failed",
                error,
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        });
}

const PS_SELECT_OCPI_CPO_TOKEN_B_EXISTS = new PreparedStatement({
    name: "PS_SELECT_OCPI_CPO_TOKEN_B_EXISTS",
    text: `SELECT EXISTS (SELECT cpo FROM ocpi_cpo WHERE token_b = $1)::bool as found`
});
export function isValidCpoToken(db: DTDatabase, tokenB: string): Promise<boolean> {
    return db
        .one<{ readonly found: boolean }>(PS_SELECT_OCPI_CPO_TOKEN_B_EXISTS, [tokenB])
        .then((result) => result.found)
        .catch((error: unknown) => {
            logger.error({
                method: `${SERVICE}.isValidCpoToken`,
                message: "failed",
                error,
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        });
}

const PS_SELECT_OCPI_CPO_WITH_TOKEN_B = new PreparedStatement({
    name: "PS_SELECT_OCPI_CPO_WITH_TOKEN_B",
    text: `select dt_cpo_id, dt_cpo_name, token_a, token_b, token_c, versions_endpoint, party_id, country_code, created, modified
           from ocpi_cpo
           where token_b = $1`
});
export function findCpoByTokenB(db: DTDatabase, tokenB: string): Promise<DbOcpiCpo | undefined> {
    return db
        .oneOrNone<DbOcpiCpo>(PS_SELECT_OCPI_CPO_WITH_TOKEN_B, [tokenB])
        .then((value) => (value ? value : undefined))
        .catch((error: unknown) => {
            logger.error({
                method: `${SERVICE}.findCpoByTokenB`,
                message: "failed",
                error,
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        });
}

const PS_UPSERT_OCPI_LOCATION = new PreparedStatement({
    name: "PS_UPSERT_OCPI_LOCATION",
    text: `INSERT INTO ocpi_location (id, dt_cpo_id, ocpi_version, location_object, geometry, modified_cpo)
           VALUES ($1, $2, $3, $4, ST_Snaptogrid(ST_SetSRID(ST_GeomFromGeoJSON($5), ${SRID_WGS84}), ${COORDINATE_PRECISION}), $6)
           ON CONFLICT ON CONSTRAINT ocpi_location_pkey
           DO UPDATE SET ocpi_version = EXCLUDED.ocpi_version,
                         location_object = EXCLUDED.location_object,
                         geometry = EXCLUDED.geometry,
                         modified_cpo = EXCLUDED.modified_cpo
          WHERE (ocpi_location.ocpi_version <> EXCLUDED.ocpi_version
             OR ocpi_location.location_object <> EXCLUDED.location_object
             OR st_asgeojson(ocpi_location.geometry) <> st_asgeojson(EXCLUDED.geometry)
             OR ocpi_location.modified_cpo <> EXCLUDED.modified_cpo)
           returning (xmax = 0)::int AS inserted, (xmax <> 0)::int AS updated`
});

export async function upsertOcpiLocation(
    db: DTDatabase | DTTransaction,
    location: DbOcpiLocationInsert
): Promise<DbInsertedUpdated> {
    const method = `${SERVICE}.upsertOcpiLocation` satisfies LoggerMethodType;

    return db
        .oneOrNone<DbInsertedUpdated>(PS_UPSERT_OCPI_LOCATION, [
            location.id,
            location.dt_cpo_id,
            location.ocpi_version,
            location.location_object,
            location.geometry,
            location.modified_cpo
        ])
        .then((value: DbInsertedUpdated | null): DbInsertedUpdated => {
            return value ? value : { inserted: 0, updated: 0 };
        })
        .catch((error: unknown) => {
            logger.error({
                method,
                message: `Failed to save location: ${JSON.stringify(location)}`,
                error,
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        });
}

export async function upsertOcpiLocations(
    db: DTDatabase,
    locations: DbOcpiLocationInsert[]
): Promise<DbInsertedUpdated> {
    const method = `${SERVICE}.upsertOcpiLocations` satisfies LoggerMethodType;

    return db
        .tx<DbInsertedUpdated>((tx) => {
            return tx
                .batch<DbInsertedUpdated>(locations.map((location) => upsertOcpiLocation(tx, location)))
                .then((results: DbInsertedUpdated[]) => {
                    const inserted = results.map((r) => r.inserted).reduce((a: number, b: number) => a + b);
                    const updated = results.map((r) => r.updated).reduce((a, b) => a + b);
                    return { inserted: inserted, updated: updated };
                });
        })
        .catch((error: unknown) => {
            logger.error({
                method,
                message: "failed",
                error,
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        });
}

const PS_UPSERT_OCPI_CPO_MODULE_ENDPOINT = new PreparedStatement({
    name: "PS_UPSERT_OCPI_CPO_MODULE_ENDPOINT",
    text: `INSERT INTO ocpi_cpo_module_endpoint (dt_cpo_id, ocpi_version, module, endpoint)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT ON CONSTRAINT ocpi_cpo_module_endpoint_pkey
           DO UPDATE SET endpoint       = EXCLUDED.endpoint`
});

export async function upsertCpoModuleEndpoint(
    db: DTDatabase,
    cpo: DbOcpiCpoModuleEndpointUpdate
): Promise<void> {
    const method = `${SERVICE}.upsertCpoModuleEndpoint` satisfies LoggerMethodType;

    logger.info({
        method,
        message: JSON.stringify(cpo)
    });

    return db
        .none(PS_UPSERT_OCPI_CPO_MODULE_ENDPOINT, [cpo.dt_cpo_id, cpo.ocpi_version, cpo.module, cpo.endpoint])
        .then(() => undefined)
        .catch((error: unknown) => {
            logger.error({
                method,
                message: `failed cpo: ${JSON.stringify(cpo)}`,
                error,
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        })
        .finally(() =>
            logger.info({
                method,
                message: "DONE"
            })
        );
}

const PS_SELECT_OCPI_CPO_MODULE_ENDPOINT = new PreparedStatement({
    name: "select-counters",
    text: `select module, dt_cpo_id, ocpi_version, endpoint, created, modified
           from ocpi_cpo_module_endpoint
           where dt_cpo_id = $1
             and ocpi_version = $2
             and module = $3`
});

export function findCpoModuleEndpoint(
    db: DTDatabase,
    dtCpoId: string,
    version: string,
    module: OcpiModule
): Promise<DbOcpiCpoModuleEndpoint | undefined> {
    return db
        .oneOrNone<DbOcpiCpoModuleEndpoint | undefined>(PS_SELECT_OCPI_CPO_MODULE_ENDPOINT, [
            dtCpoId,
            version,
            module
        ])
        .then((value) => (value ? value : undefined))
        .catch((error: unknown) => {
            logger.error({
                method: `${SERVICE}.findCpoModuleEndpoint`,
                message: `failed`,
                error,
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        });
}

const PS_FIND_CPO_LATEST_VERSION = new PreparedStatement({
    name: "PS_FIND_REGISTERED_CPOS_LATEST_ENDPOINT_VERSIONS",
    text: `SELECT ver.ocpi_version
           FROM ocpi_cpo cpo
           INNER JOIN ocpi_cpo_version AS ver
             ON ver.dt_cpo_id = cpo.dt_cpo_id
           WHERE cpo.dt_cpo_id = $1
           ORDER BY ver.ocpi_version DESC
           LIMIT 1`
});

export function findCpoLatestVersion(db: DTDatabase, dtCpoId: string): Promise<VersionString> {
    return db
        .one<{ ocpi_version: VersionString }>(PS_FIND_CPO_LATEST_VERSION, [dtCpoId])
        .then((value) => {
            return value.ocpi_version;
        })
        .catch((error: unknown) => {
            logger.error({
                method: `${SERVICE}.findCpoLatestVersion`,
                message: `failed`,
                error,
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        });
}

const PS_FIND_CPO_LOCATIONS = new PreparedStatement({
    name: "PS_FIND_CPO_LOCATIONS",
    text: `SELECT id, dt_cpo_id, ocpi_version, location_object, ST_AsGeoJSON(geometry) as geometry, modified_cpo, modified, created
           FROM ocpi_location 
           WHERE dt_cpo_id = $1
           ORDER BY id`
});

export function findLocations(db: DTDatabase, dtCpoId: string): Promise<DbOcpiLocation[]> {
    return db
        .manyOrNone<DbOcpiLocation>(PS_FIND_CPO_LOCATIONS, [dtCpoId])
        .then((result) => {
            result.forEach((location) => {
                // Select uses ST_AsGeoJSON : string, so we convert it to GeoJsonPoint object
                const geoJson = JSON.parse(location.geometry as unknown as string) as GeoJsonPoint;
                Object.assign(location, { geometry: geoJson });
            });
            return result;
        })
        .catch((error: unknown) => {
            logger.error({
                method: `${SERVICE}.findLocations`,
                message: `failed`,
                error,
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        });
}

// const PS_FIND_REGISTERED_CPOS_LATEST_ENDPOINT_VERSIONS = new PreparedStatement({
//     name: "PS_FIND_REGISTERED_CPOS_LATEST_ENDPOINT_VERSIONS",
//     text: `SELECT DISTINCT ON (module_ep.dt_cpo_id) module_ep.dt_cpo_id
//                 , module_ep.module
//                 , module_ep.ocpi_version
//                 , module_ep.endpoint
//                 , module_ep.created
//                 , module_ep.modified
//            FROM ocpi_cpo cpo
//            INNER JOIN ocpi_cpo_version AS ver
//              ON ver.dt_cpo_id = cpo.dt_cpo_id
//            INNER JOIN ocpi_cpo_module_endpoint module_ep
//              ON ver.dt_cpo_id = module_ep.dt_cpo_id
//             AND ver.ocpi_version = module_ep.ocpi_version
//            WHERE cpo.token_c is not null
//              AND module_ep.module = $1
//            ORDER BY module_ep.dt_cpo_id ASC, ver.ocpi_version DESC`
// });

// export function findRegisteredCposLatestEndpointVersions(db: DTDatabase, module: OcpiModule): Promise<DbOcpiCpoVersionEndpoint[]> {
//     return db.manyOrNone<DbOcpiCpoVersionEndpoint>(PS_FIND_REGISTERED_CPOS_LATEST_ENDPOINT_VERSIONS, [module] );
// }
