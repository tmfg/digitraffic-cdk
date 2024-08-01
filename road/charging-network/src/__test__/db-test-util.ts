import { type DTDatabase } from "@digitraffic/common/dist/database/database";
import { dbTestBase as commonDbTestBase } from "@digitraffic/common/dist/test/db-testutils";
import { type VersionString } from "../api/ocpi/ocpi-api-responses.js";
import { VERSION_2_1_1 } from "../model/ocpi-constants.js";

export function dbTestBase(fn: (db: DTDatabase) => void): () => void {
    return commonDbTestBase(fn, truncate, "road", "road", "localhost:54322/road");
}

export async function truncate(db: DTDatabase): Promise<void> {
    await db.tx(async (t) => {
        await t.none("DELETE FROM ocpi_location");
        await t.none("DELETE FROM ocpi_cpo_module_endpoint");
        await t.none("DELETE FROM ocpi_cpo_version");
        await t.none("DELETE FROM ocpi_cpo_business_details");
        await t.none("DELETE FROM ocpi_cpo");
        await t.none(`DELETE
                      FROM ocpi_version
                      where version <> '${VERSION_2_1_1}'`);
    });
}

export async function insertOcpiCpo(
    db: DTDatabase,
    cpo: string,
    name: string,
    tokenA: string,
    tokenB: string | undefined,
    tokenC: string | undefined,
    versionsEndpoint: string
): Promise<void> {
    await db.tx((t) => {
        return t.none(
            `insert into ocpi_cpo(dt_cpo_id, dt_cpo_name, token_a, token_b, token_c, versions_endpoint)
             values ($1, $2, $3, $4, $5, $6)`,
            [cpo, name, tokenA, tokenB, tokenC, versionsEndpoint]
        );
    });
}

export async function insertOcpiVersion(db: DTDatabase, version: VersionString): Promise<void> {
    await db.tx((t) => {
        return t.none(
            `insert into ocpi_version (version)
             values ($1)`,
            [version]
        );
    });
}
