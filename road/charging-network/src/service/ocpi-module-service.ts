import { type LoggerMethodType, logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { inDatabaseReadonly } from "@digitraffic/common/dist/database/database";
import type { VersionString } from "../api/ocpi/ocpi-api-responses.js";
import * as OcpiDao from "../dao/ocpi-dao.js";
import type { DbOcpiCpoModuleEndpoint } from "../model/dao-models.js";
import type { OcpiModule } from "../model/ocpi-constants.js";

const SERVICE = "OcpiModuleService";

export async function findCpoModuleEndpoint(
    dtCpoId: string,
    ocpiVersion: VersionString,
    module: OcpiModule
): Promise<DbOcpiCpoModuleEndpoint | undefined> {
    const start = Date.now();
    const method = `${SERVICE}.findCpoModuleEndpoint` satisfies LoggerMethodType;

    return inDatabaseReadonly(async (db): Promise<DbOcpiCpoModuleEndpoint | undefined> => {
        const endpoint: DbOcpiCpoModuleEndpoint | undefined = await OcpiDao.findCpoModuleEndpoint(
            db,
            dtCpoId,
            ocpiVersion,
            module
        );

        logger.info({
            method,
            customDtCpoId: dtCpoId,
            message: endpoint
                ? `found ${module} endpoint ${JSON.stringify(endpoint)} for version ${ocpiVersion}`
                : `no ${module} endpoint for version ${ocpiVersion} found`,
            tookMs: Date.now() - start
        });
        return endpoint;
    });
}
export function getCpoLatestVersion(dtCpoId: string): Promise<VersionString> {
    const start = Date.now();
    const method = `${SERVICE}.getCpoLatestVersion` satisfies LoggerMethodType;

    return inDatabaseReadonly(async (db): Promise<VersionString> => {
        const version: VersionString = await OcpiDao.findCpoLatestVersion(db, dtCpoId);
        logger.debug({
            method,
            customDtCpoId: dtCpoId,
            message: `found version ${version}`,
            tookMs: Date.now() - start
        });
        return version;
    });
}
