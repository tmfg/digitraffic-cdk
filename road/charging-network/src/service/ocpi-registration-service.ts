import { logger, type LoggerMethodType } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { type DTDatabase, inDatabase, inDatabaseReadonly } from "@digitraffic/common/dist/database/database";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { compareVersions } from "compare-versions";
import { v4 as uuidv4 } from "uuid";
import type { BusinessDetails, CredentialsObject } from "../api/ocpi/2_1_1/ocpi-api-responses_2_1_1.js";
import * as OcpiApi_2_1_1 from "../api/ocpi/2_1_1/ocpi-api_2_1_1.js";
import * as OcpiApi from "../api/ocpi/ocpi-api.js";
import type {
    Endpoint,
    Version,
    VersionDetailsResponse,
    VersionsResponse,
    VersionString
} from "../api/ocpi/ocpi-api-responses.js";
import * as OcpiDao from "../dao/ocpi-dao.js";
import { ChargingNetworkKeys } from "../keys.js";
import type { DbOcpiCpo, DbOcpiCpoBusinessDetailsUpdate } from "../model/dao-models.js";
import { OCPI_MODULE_CREDENTIALS, SUPPORTED_VERSIONS, VERSION_2_1_1 } from "../model/ocpi-constants.js";

const SERVICE = "OcpiRegistrationService";

const domain = getEnvVariable(ChargingNetworkKeys.OCPI_DOMAIN_URL);
const partyId = getEnvVariable(ChargingNetworkKeys.OCPI_PARTY_ID);

const BUSINESS_DETAILS_NAME = getEnvVariable(ChargingNetworkKeys.OCPI_BUSINESS_DETAILS_NAME);
const WEBSITE = getEnvVariable(ChargingNetworkKeys.OCPI_BUSINESS_DETAILS_WEBSITE);

export async function findUnregisteredCpos(): Promise<DbOcpiCpo[]> {
    const method = `${SERVICE}.findUnregisteredCpos` satisfies LoggerMethodType;

    return inDatabaseReadonly(async (db: DTDatabase): Promise<DbOcpiCpo[]> => {
        const unregistered = await OcpiDao.findUnregisteredCpos(db);
        logger.info({
            method,
            message: `found ${unregistered.length} unregistered CPOs ${JSON.stringify(unregistered)}`
        });
        return unregistered;
    });
}

export async function findRegisteredCPOs(): Promise<DbOcpiCpo[]> {
    const method = `${SERVICE}.findRegisteredCPOs` satisfies LoggerMethodType;

    return inDatabaseReadonly(async (db: DTDatabase): Promise<DbOcpiCpo[]> => {
        const registered = await OcpiDao.findRegisteredCpos(db);
        logger.info({
            method,
            message: `found ${registered.length} registered CPOs ${JSON.stringify(registered)}`
        });
        return registered;
    });
}

/**
 * Handles cpo registration
 * 1. resolves higest common ocpi version that both parties supports
 * 2.
 * @param cpo to register
 * @returns
 */
export async function handleCpoRegistration(cpo: DbOcpiCpo): Promise<void> {
    const method = `${SERVICE}.handleCpoRegistration` satisfies LoggerMethodType;
    const startCpo = Date.now();
    logger.info({
        method,
        message: `found unregistered CPO: ${JSON.stringify(cpo)}`,
        customDtCpoId: cpo.dt_cpo_id
    });

    try {
        const version: Version | undefined = await resolveCommonVersionWithCpo(
            cpo.dt_cpo_id,
            cpo.versions_endpoint,
            cpo.token_a
        );

        if (!version) {
            logger.info({
                method,
                customDtCpoId: cpo.dt_cpo_id,
                message: "No common version found"
            });
            return;
        }

        const endpoints: Endpoint[] | undefined = await getCpoVersionModuleEndpoints(
            cpo.dt_cpo_id,
            cpo.token_a,
            version
        );

        if (!endpoints) {
            logger.info({
                method,
                customDtCpoId: cpo.dt_cpo_id,
                customVersion: version.version,
                customVersionUrl: version.url,
                message: "No endpoints for version found"
            });
            logEndCpoRegistration(cpo.dt_cpo_id, startCpo, method);
            return;
        }
        await updateCpoVersionModuleEndpoints(cpo.dt_cpo_id, version, endpoints);

        // Generate new token that cpo uses to authenticate when using our APIs
        const tokenB: string = generateToken();
        await saveTokenB(cpo.dt_cpo_id, tokenB);

        logger.info({
            method,
            customDtCpoId: cpo.dt_cpo_id,
            customVersion: version.version,
            message: "Saved tokenB for cpo"
        });

        return await doRegistration(
            cpo.dt_cpo_id,
            cpo.token_a,
            version.version,
            tokenB,
            domain,
            partyId,
            BUSINESS_DETAILS_NAME,
            WEBSITE
        );
    } catch (error) {
        logger.error({
            method,
            customDtCpoId: cpo.dt_cpo_id,
            message: "Error during registration of cpo",
            error: error
        });
        if (error instanceof Error) {
            throw error;
        }
        throw new Error(`Error during registration of cpo in ${method}`, { cause: error });
    } finally {
        logger.info({
            method,
            customDtCpoId: cpo.dt_cpo_id,
            tookMs: Date.now() - startCpo,
            message: "End cpo registration"
        });
    }
}

function logEndCpoRegistration(dtCpoId: string, startMs: number, method: LoggerMethodType): void {
    logger.info({
        method,
        customDtCpoId: dtCpoId,
        tookMs: Date.now() - startMs,
        message: "End cpo registration"
    });
}

export async function doRegistration(
    dtCpoId: string,
    tokenA: string,
    ocpiVersion: VersionString,
    tokenB: string,
    domain: string,
    partyId: string,
    businessDetailsName: string,
    businessDetailsWebsite: string
): Promise<void> {
    const method = `${SERVICE}.doRegistration` satisfies LoggerMethodType;

    return inDatabase(async (db: DTDatabase) => {
        const credentialsEndpoint = await OcpiDao.findCpoModuleEndpoint(
            db,
            dtCpoId,
            ocpiVersion,
            OCPI_MODULE_CREDENTIALS
        );
        if (!credentialsEndpoint) {
            throw new Error(
                `No credentials endpoint found for dtCpoId: ${dtCpoId} and version: ${ocpiVersion}.`
            );
        }

        if (VERSION_2_1_1 === ocpiVersion) {
            const credentials: CredentialsObject = await OcpiApi_2_1_1.postCredentials(
                credentialsEndpoint.endpoint,
                tokenA,
                tokenB,
                domain,
                partyId,
                businessDetailsName,
                businessDetailsWebsite
            );
            logger.debug({
                method,
                customDtCpoId: dtCpoId,
                customOcpiVersion: ocpiVersion,
                message: `Got credentials` // Don't log content, contains secret
            });

            if (credentials.data.token.length) {
                await OcpiDao.updateCpoCredentials(
                    db,
                    dtCpoId,
                    credentials.data.token, // token c
                    credentials.data.url,
                    credentials.data.party_id,
                    credentials.data.country_code
                ).then(async () => {
                    if (credentials.data.business_details) {
                        const bd: BusinessDetails = credentials.data.business_details;
                        try {
                            await OcpiDao.upsertCpoBusinessDetails(
                                db,
                                {
                                    dt_cpo_id: dtCpoId,
                                    name: bd.name,
                                    logo_url: bd.logo?.url,
                                    logo_thumbnail: bd.logo?.thumbnail,
                                    logo_category: bd.logo?.category,
                                    logo_type: bd.logo?.type,
                                    logo_width: bd.logo?.width,
                                    logo_height: bd.logo?.height,
                                    website: bd.website
                                } satisfies DbOcpiCpoBusinessDetailsUpdate
                                /*
                                dtCpoId,
                                bd.name,
                                bd.logo?.url,
                                bd.logo?.thumbnail,
                                bd.logo?.category,
                                bd.logo?.type,
                                bd.logo?.width,
                                bd.logo?.height,
                                bd.website*/
                            );
                        } catch (error) {
                            logger.error({
                                method,
                                customDtCpoId: dtCpoId,
                                message: `Failed to upsertCpoBusinessDetails ${JSON.stringify(credentials)}`,
                                error: error,
                                stack: error instanceof Error ? error.stack : undefined
                            });
                        }
                    } else {
                        logger.info({
                            method,
                            customDtCpoId: dtCpoId,
                            message: `No cpo business details`
                        });
                    }
                });
            } else {
                logger.error({
                    method,
                    customDtCpoId: dtCpoId,
                    message: `Missing token(c) in credentials ${JSON.stringify(credentials)}`
                });
                throw new Error(
                    `Missing token(c) credentials with dtCpoId ${dtCpoId}: ${JSON.stringify(credentials)}`
                );
            }
        } else {
            logger.error({
                method,
                customDtCpoId: dtCpoId,
                message: `Unsuported ocpi version ${ocpiVersion}`
            });
            throw new Error(
                `Unsuported ocpi version ${ocpiVersion} with dtCpoId ${dtCpoId}. Suported versions are ${JSON.stringify(
                    SUPPORTED_VERSIONS
                )}`
            );
        }
    });
}

/**
 * Resolves common version with CPO
 * @param dtCpoId id of cpo
 * @param versionsEndpoint of cpo
 * @param token to be used with cpo
 * @return common version with given CPO
 */
export async function resolveCommonVersionWithCpo(
    dtCpoId: string,
    versionsEndpoint: string,
    token: string
): Promise<Version | undefined> {
    const method = `${SERVICE}.resolveCommonVersionWithCpo` satisfies LoggerMethodType;

    const versionsResponse: VersionsResponse = await OcpiApi.getVersions(versionsEndpoint, token);
    const version: Version | undefined = resolveLatestCommonVersion(
        SUPPORTED_VERSIONS,
        versionsResponse.data
    );

    logger.info({
        method,
        customDtCpoId: dtCpoId,
        customVersion: version?.version,
        message: version ? `Found common version` : `No common OCPI version`
    });
    return version;
}

/**
 * Fetch endpoints for given version
 * @param dtCpoId cpo id
 * @param token for cpo api
 * @param version to get endpoints for
 * @return common version saved to db or undefined if no common version found
 */
export async function getCpoVersionModuleEndpoints(
    dtCpoId: string,
    token: string,
    version: Version
): Promise<Endpoint[] | undefined> {
    const method = `${SERVICE}.getCpoVersionEndpoints` satisfies LoggerMethodType;

    const versionEndpoints = (await OcpiApi.getFromServer<VersionDetailsResponse>(version.url, token)).data;

    logger.info({
        method,
        customDtCpoId: dtCpoId,
        customVersionUrl: version.url,
        customStatusCode: versionEndpoints.status_code,
        customTimestamp: versionEndpoints.timestamp,
        customVersion: versionEndpoints.data.version,
        customVersionEndpoints: JSON.stringify(versionEndpoints.data.endpoints),
        message: versionEndpoints.data.endpoints ? `Found version endpoints` : "No version endpoints found"
    });
    return versionEndpoints.data.endpoints;
}

/**
 * @param dtCpoId cpo id
 * @param token for cpo api
 * @return common version saved to db or undefined if no common version found
 */
export async function updateCpoVersionModuleEndpoints(
    dtCpoId: string,
    version: Version,
    endpoints: Endpoint[]
): Promise<void> {
    const method = `${SERVICE}.updateCpoVersionModuleEndpoints` satisfies LoggerMethodType;

    return inDatabase(async (db): Promise<void> => {
        // Save cpo version info
        await OcpiDao.upsertCpoVersion(db, {
            dt_cpo_id: dtCpoId,
            ocpi_version: version.version,
            endpoints_endpoint: version.url
        });
        // Save cpo endpoints for version
        await Promise.allSettled(
            endpoints.map((e) => {
                return OcpiDao.upsertCpoModuleEndpoint(db, {
                    dt_cpo_id: dtCpoId,
                    ocpi_version: version.version,
                    module: e.identifier,
                    endpoint: e.url
                });
            })
        ).then((results) =>
            results.forEach((result) => {
                if (result.status === "rejected") {
                    logger.error({
                        method,
                        customDtCpoId: dtCpoId,
                        customOcpiVersion: version.version,
                        message: `Failed to update cpo module endpoint`,
                        error: result.reason,
                        stack: result.reason instanceof Error ? result.reason.stack : undefined
                    });
                }
            })
        );
    });
}

export function resolveLatestCommonVersion(
    supportedVersions: VersionString[],
    cpoVersions?: Version[]
): Version | undefined {
    const method = `${SERVICE}.resolveLatestCommonVersion` satisfies LoggerMethodType;

    const remoteVersions =
        cpoVersions && cpoVersions.length ? cpoVersions.map((v) => v.version).join(", ") : "none";
    logger.debug({
        method,
        message: `cpo versions: ${remoteVersions} and supported versions: ${supportedVersions.join(", ")}`
    });

    if (!cpoVersions) {
        return undefined;
    }

    // Sort the version arrays in descending order
    const sortedCpoVersions = cpoVersions.sort((a, b) => compareVersions(b.version, a.version));
    const sortedSupportedVersions = SUPPORTED_VERSIONS.sort((a, b) => compareVersions(b, a));

    // Find the highest common version
    for (const cpoVersion of sortedCpoVersions) {
        const commonFound = sortedSupportedVersions.find((supportedVersion) => {
            logger.debug({
                method,
                message: `sortedSupportedVersions.find compare supportedVersion: ${supportedVersion} vs cpoVersion: ${cpoVersion.version}`
            });
            return supportedVersion === cpoVersion.version;
        });
        if (commonFound) {
            return cpoVersion;
        }
    }

    return undefined; // No common version found
}

export function generateToken(): string {
    return uuidv4();
}

function saveTokenB(cpo: string, tokenB: string): Promise<void> {
    return inDatabase(async (db): Promise<void> => {
        // Save token b for cpo authentication to us
        return OcpiDao.upsertTokenB(db, cpo, tokenB);
    });
}
