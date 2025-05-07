import pgpImport, {
  type IDatabase,
  type IInitOptions,
  type IMain,
  type ITask,
} from "pg-promise";
import type { IClient } from "pg-promise/typescript/pg-subset.js";
import { logger } from "../aws/runtime/dt-logger-default.js";
import { logException } from "../utils/logging.js";
import { getEnvVariable, getEnvVariableOrElse } from "../utils/utils.js";

export enum DatabaseEnvironmentKeys {
  DB_USER = "DB_USER",
  DB_PASS = "DB_PASS",
  DB_URI = "DB_URI",
  DB_RO_URI = "DB_RO_URI",
  DB_APPLICATION = "DB_APPLICATION",
}

// pg-promise initialization options
// https://vitaly-t.github.io/pg-promise/global.html#event:receive
const pgpPromiseInitOptions: IInitOptions = {
  // eslint-disable-next-line
  receive(e: { data: any[] }): void {
    if (e.data) {
      convertNullColumnsToUndefined(e.data);
    }
  },
};

function initPgp(
  pgpPromiseInitOptions?: IInitOptions,
): IMain<unknown, IClient> {
  const pgp: IMain<unknown, IClient> = pgpPromiseInitOptions
    ? pgpImport(pgpPromiseInitOptions)
    : pgpImport();

  // convert numeric types to number instead of string
  pgp.pg.types.setTypeParser(pgp.pg.types.builtins.INT8, (value: string) => {
    return parseInt(value);
  });

  pgp.pg.types.setTypeParser(pgp.pg.types.builtins.FLOAT8, (value: string) => {
    return parseFloat(value);
  });

  pgp.pg.types.setTypeParser(pgp.pg.types.builtins.NUMERIC, (value: string) => {
    return parseFloat(value);
  });
  return pgp;
}

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
 * @param convertNullsToUndefined if true null values in query results will be converted to undefined, Default false.
 * @param options pg-promise options
 */
export function initDbConnection(
  username: string,
  password: string,
  applicationName: string,
  url: string,
  convertNullsToUndefined: boolean,
  options?: object,
): DTDatabase {
  const finalUrl =
    `postgresql://${username}:${password}@${url}?application_name=${applicationName}`;

  return initPgp(convertNullsToUndefined ? pgpPromiseInitOptions : undefined)(
    finalUrl,
    options,
  );
}

export function inTransaction<T>(
  fn: (db: DTTransaction) => Promise<T>,
  convertNullsToUndefined: boolean = false,
): Promise<T> {
  return inDatabase(
    (db) => db.tx((t: DTTransaction) => fn(t)),
    convertNullsToUndefined,
  );
}

export function inDatabase<T>(
  fn: (db: DTDatabase) => Promise<T>,
  convertNullsToUndefined: boolean = false,
): Promise<T> {
  return doInDatabase(false, fn, convertNullsToUndefined);
}

export function inDatabaseReadonly<T>(
  fn: (db: DTDatabase) => Promise<T>,
  convertNullsToUndefined: boolean = false,
): Promise<T> {
  return doInDatabase(true, fn, convertNullsToUndefined);
}

async function doInDatabase<T>(
  readonly: boolean,
  fn: (db: DTDatabase) => Promise<T>,
  convertNullsToUndefined: boolean,
): Promise<T> {
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
    convertNullsToUndefined,
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

// eslint-disable-next-line
function convertNullColumnsToUndefined(rows: any[]) {
  rows.forEach((row) => {
    // eslint-disable-next-line guard-for-in
    for (const column in row) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      const columnValue = row[column];
      if (columnValue === null) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        row[column] = undefined;
      }
    }
  });
}
