import { type IDatabase, type ITask } from "pg-promise";
import { getEnvVariable, getEnvVariableOrElse } from "../utils/utils.js";
import { logger } from "../aws/runtime/dt-logger-default.js";
import { logException } from "../utils/logging.js";

export enum DatabaseEnvironmentKeys {
    DB_USER = "DB_USER",
    DB_PASS = "DB_PASS",
    DB_URI = "DB_URI",
    DB_RO_URI = "DB_RO_URI",
    DB_APPLICATION = "DB_APPLICATION",
}
import pgpImport from "pg-promise";
const pgp = pgpImport();

// convert numeric types to number instead of string
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
pgp.pg.types.setTypeParser(pgp.pg.types.builtins.INT8, (value: string) => {
    return parseInt(value);
});

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
pgp.pg.types.setTypeParser(pgp.pg.types.builtins.FLOAT8, (value: string) => {
    return parseFloat(value);
});

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
pgp.pg.types.setTypeParser(pgp.pg.types.builtins.NUMERIC, (value: string) => {
    return parseFloat(value);
});

export type DTDatabase = IDatabase<unknown>;

export type DTTransaction = ITask<unknown>;

/**
 * Creates a non-pooling database connection primarily used by Lambdas.
 *
 * Note! Using this method opens a new RDS connection on every invocation. It is advised to
 * use RDS proxy to pool connections transparently.
 * https://docs.amazonaws.cn/en_us/AmazonRDS/latest/AuroraUserGuide/rds-proxy.html
 * @param username Username
 * @param password Password
 * @param applicationName name of application
 * @param url Connection URL
 * @param options pg-promise options
 */
export function initDbConnection(
    username: string,
    password: string,
    applicationName: string,
    url: string,
    options?: object,
): DTDatabase {
    const finalUrl = `postgresql://${username}:${password}@${url}?application_name=${applicationName}`;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
    return pgp(finalUrl, options);
}

export function inTransaction<T>(fn: (db: DTTransaction) => Promise<T>): Promise<T> {
    return inDatabase((db) => db.tx((t: DTTransaction) => fn(t)));
}

export function inDatabase<T>(fn: (db: DTDatabase) => Promise<T>): Promise<T> {
    return doInDatabase(false, fn);
}

export function inDatabaseReadonly<T>(fn: (db: DTDatabase) => Promise<T>): Promise<T> {
    return doInDatabase(true, fn);
}

async function doInDatabase<T>(readonly: boolean, fn: (db: DTDatabase) => Promise<T>): Promise<T> {
    const db_application = getEnvVariableOrElse(
        DatabaseEnvironmentKeys.DB_APPLICATION,
        "unknown-cdk-application",
    );
    const db_uri = readonly
        ? getEnvVariable(DatabaseEnvironmentKeys.DB_RO_URI)
        : getEnvVariable(DatabaseEnvironmentKeys.DB_URI);

    const db = initDbConnection(
        getEnvVariable(DatabaseEnvironmentKeys.DB_USER),
        getEnvVariable(DatabaseEnvironmentKeys.DB_PASS),
        db_application,
        db_uri,
    );
    try {
        // deallocate all prepared statements to allow for connection pooling
        // DISCARD instead of DEALLOCATE as it didn't always clean all prepared statements
        await db.none("DISCARD ALL");
        return await fn(db);
    } catch (e) {
        logException(logger, e);

        throw e;
    } finally {
        await db.$pool.end();
    }
}
