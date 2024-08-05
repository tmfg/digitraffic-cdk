import type { Connection } from "mysql2/promise";
import * as mysql from "../util/database.js";

export type DbUnitTestFunction = (db: Connection) => void;

type JestEmptyFunction = () => void;

export enum DatabaseEnvironmentKeys {
    DB_USER = "DB_USER",
    DB_PASS = "DB_PASS",
    DB_URI = "DB_URI",
    DB_RO_URI = "DB_RO_URI",
    DB_APPLICATION = "DB_APPLICATION"
}

async function truncate(db: Connection): Promise<void> {
    await db.execute("DELETE FROM rami_message");
    await db.execute("DELETE FROM rami_stop_monitoring_message");
    await db.execute("DELETE FROM rami_udot");
}

export function dbTestBase(fn: JestEmptyFunction): JestEmptyFunction {
    return () => {
        beforeAll(async () => {
            await mysql.inTransaction(truncate);
        });

        afterAll(async () => {
            await mysql.inTransaction(truncate);
        });

        beforeEach(async () => {
            await mysql.inTransaction(truncate);
        });

        fn();
    };
}
