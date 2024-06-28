import { type LoggerMethodType, logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { type DTDatabase, inDatabase } from "@digitraffic/common/dist/database/database";
import { GeoJsonPoint } from "@digitraffic/common/dist/utils/geojson-types";
import type { Location } from "../api/ocpi/2_1_1/ocpi-api-responses_2_1_1.js";
import * as OcpiApi_2_1_1 from "../api/ocpi/2_1_1/ocpi-api_2_1_1.js";
import * as OcpiDao from "../dao/ocpi-dao.js";
import type {
    DbInsertedUpdated,
    DbOcpiCpo,
    DbOcpiCpoModuleEndpoint,
    DbOcpiLocationInsert
} from "../model/dao-models.js";
import { OCPI_MODULE_LOCATIONS, VERSION_2_1_1 } from "../model/ocpi-constants.js";
import * as OcpiModuleService from "./ocpi-module-service.js";

const SERVICE = "OcpiLocationService2_1_1";
const OCPI_MODULE = OCPI_MODULE_LOCATIONS;
const OCPI_VERSION = VERSION_2_1_1;

export async function updateLocationsForCpo(cpo: DbOcpiCpo): Promise<DbInsertedUpdated> {
    const method = `${SERVICE}.updateLocationsForCpo` satisfies LoggerMethodType;

    if (cpo.token_c === undefined || cpo.token_c === null) {
        throw new Error(`${method} cpo ${cpo.dt_cpo_id} token_c was empty`);
    }

    const endpoint = await OcpiModuleService.findCpoModuleEndpoint(cpo.dt_cpo_id, OCPI_VERSION, OCPI_MODULE);

    if (endpoint) {
        return getAndUpdateLocationsForCpo(cpo.dt_cpo_id, cpo.token_c, endpoint);
    } else {
        logger.error({
            method,
            customDtCpoId: cpo.dt_cpo_id,
            customOcpiVersion: OCPI_VERSION,
            message: `No ${OCPI_MODULE} endpoint found`
        });
        throw new Error(
            `No ${OCPI_MODULE} endpoint found for dtCpoId: ${cpo.dt_cpo_id} and version: ${OCPI_VERSION}`
        );
    }
}

async function getAndUpdateLocationsForCpo(
    dtCpoId: string,
    tokenC: string,
    endpoint: DbOcpiCpoModuleEndpoint
): Promise<DbInsertedUpdated> {
    const method = `${SERVICE}.getAndUpdateLocationsForCpo` satisfies LoggerMethodType;

    let updatedCount = 0;
    let insertedCount = 0;

    // With offset=0 and limit=10 the server shall return the first 10 records
    // if 10 objects match the request. Then next page starts with offset=10.
    // Limit fetch size
    let limit = 100;
    // Start with offset 0 and increase it between every fetch until
    // all are fetched (offset => totalCount)
    let offset = 0;
    let totalCount = limit;

    while (offset < totalCount) {
        const response = await OcpiApi_2_1_1.getLocations(endpoint.endpoint, tokenC, offset, limit);

        const updateResult = await updateLocationsToDb(dtCpoId, OCPI_VERSION, response.response.data);
        insertedCount += updateResult.inserted;
        updatedCount += updateResult.updated;
        logger.info({
            method,
            customDtCpoId: dtCpoId,
            customOcpiVersion: OCPI_VERSION,
            customUpdatedCount: updateResult.updated,
            customInsertedCount: updateResult.inserted,
            message: `Fetch offset: ${offset}, limit: ${limit}. Response count:${
                response.response.data.length
            }, limit:${response.limit ? response.limit : "undefined"}, totalCount:${
                response.totalCount ? response.totalCount : "undefined"
            }.`
        });
        // If server says it only returns max limit amount, set request to match that
        if (response.limit && response.limit < limit) {
            limit = response.limit;
        }
        if (response.totalCount !== undefined) {
            totalCount = response.totalCount;
        }
        // No data
        if (!response.response.data || response.response.data.length === 0) {
            // Set totalCount to offset value so we stop here as no data returned from server
            totalCount = offset;
        }
        // increase offset to get next batch of items
        offset += limit;
    }

    logger.debug({
        method,
        customDtCpoId: dtCpoId,
        customOcpiVersion: OCPI_VERSION,
        customUpdatedCount: updatedCount,
        customInsertedCount: insertedCount,
        message: `Summary for updating ${dtCpoId} cpo locations`
    });

    return { inserted: insertedCount, updated: updatedCount } satisfies DbInsertedUpdated;
}

function updateLocationsToDb(
    dtCpoId: string,
    ocpiVersion: string,
    locations: Location[]
): Promise<DbInsertedUpdated> {
    const start = Date.now();
    const method = `${SERVICE}.updateLocations` satisfies LoggerMethodType;

    return inDatabase(async (db: DTDatabase) => {
        if (locations) {
            const inserts: DbOcpiLocationInsert[] = locations.map((location: Location, index: number) => {
                return {
                    id: location.id,
                    dt_cpo_id: dtCpoId,
                    location_object: location,
                    geometry: new GeoJsonPoint([
                        location.coordinates.longitude,
                        location.coordinates.latitude
                    ]),
                    ocpi_version: ocpiVersion,
                    modified_cpo: location.last_updated
                } as DbOcpiLocationInsert;
            });

            return OcpiDao.upsertOcpiLocations(db, inserts);
        }
        return { inserted: 0, updated: 0 };
    }).then((result) => {
        logger.debug({
            method,
            customDtCpoId: dtCpoId,
            customOcpiVersion: ocpiVersion,
            customUpdatedCount: result.updated,
            customInsertedCount: result.inserted,
            tookMs: Date.now() - start
        });
        return result;
    });
}
