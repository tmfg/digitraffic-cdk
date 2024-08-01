import { type LoggerMethodType, logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import type { VersionString } from "../api/ocpi/ocpi-api-responses.js";
import type { DbInsertedUpdated, DbOcpiCpo } from "../model/dao-models.js";
import { SUPPORTED_VERSIONS, VERSION_2_1_1 } from "../model/ocpi-constants.js";
import * as OcpiLocationsService211 from "./ocpi-location-service-2_1_1.js";
import * as OcpiModuleService from "./ocpi-module-service.js";

const SERVICE = "OcpiLocationService";

export interface LocationsUpdatedResult extends DbInsertedUpdated {
    readonly dtCpoId: string;
    readonly version: VersionString;
}

export function updateLocationsForCpos(cpos: DbOcpiCpo[]): Promise<void> {
    const method = `${SERVICE}.updateLocationsForCpos` satisfies LoggerMethodType;
    const start = Date.now();

    logger.info({
        method,
        message: `update locations for cpo's: ${cpos.map((c) => c.dt_cpo_id).toString()}`
    });

    return Promise.allSettled(cpos.map((cpo) => updateLocationsForCpo(cpo)))
        .then((result: PromiseSettledResult<LocationsUpdatedResult>[]) => {
            result.map((r) => {
                if (r.status === "fulfilled") {
                    logger.info({
                        method,
                        customDtCpoId: r.value.dtCpoId,
                        customOcpiVersion: r.value.version,
                        customUpdatedCount: r.value.updated,
                        customInsertedCount: r.value.inserted,
                        message: `Summary for updating single cpo locations`
                    });
                } else if (r.status === "rejected") {
                    logger.error({
                        method,
                        message: r.reason instanceof Error ? r.reason.message : JSON.stringify(r.reason)
                    });
                }
            });
        })
        .finally(() => {
            logger.info({
                method,
                message: `Summary for updating all cpo's locations`,
                customCpoCount: cpos.length,
                tookMs: Date.now() - start
            });
        });
}

async function updateLocationsForCpo(cpo: DbOcpiCpo): Promise<LocationsUpdatedResult> {
    const method = `${SERVICE}.updateLocationsForCpo` satisfies LoggerMethodType;

    if (cpo.token_c === undefined || cpo.token_c === null) {
        throw new Error(`${method} cpo ${cpo.dt_cpo_id} token_c was empty`);
    }

    logger.info({
        method,
        customDtCpoId: cpo.dt_cpo_id
    });

    return OcpiModuleService.getCpoLatestVersion(cpo.dt_cpo_id).then((version: VersionString) => {
        if (VERSION_2_1_1 === version) {
            return OcpiLocationsService211.updateLocationsForCpo(cpo).then((result) => {
                return {
                    ...result,
                    ...{
                        dtCpoId: cpo.dt_cpo_id,
                        version
                    }
                };
            });
            // } else if (VERSION_2_2 === version) {
            //         return OcpiLocationsService22.updateLocationsForCpo(cpo)
            //         .then((result) => {
            //             return {
            //                 ...result,
            //                 ...{
            //                     dtCpoId: cpo.dt_cpo_id,
            //                     version
            //                 }
            //             };
            //         });
        } else {
            const message = `Unsupported OCPI version ${version}. Supported versions are ${JSON.stringify(
                SUPPORTED_VERSIONS
            )}.`;
            logger.error({
                method,
                customDtCpoId: cpo.dt_cpo_id,
                customOcpiVersion: version,
                message
            });
            throw new Error(`${message} method: ${method} dtCpoId: ${cpo.dt_cpo_id}`);
        }
    });
}
