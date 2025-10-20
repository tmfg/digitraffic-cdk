import type { Connection } from "mysql2/promise";
import * as mysql from "../util/database.js";
import { inTransaction } from "../util/database.js";
import { get } from "lodash-es";

export type DbUnitTestFunction = (db: Connection) => void;

type JestEmptyFunction = () => void;

export enum DatabaseEnvironmentKeys {
  DB_USER = "DB_USER",
  DB_PASS = "DB_PASS",
  DB_URI = "DB_URI",
  DB_RO_URI = "DB_RO_URI",
  DB_APPLICATION = "DB_APPLICATION",
}

async function truncate(db: Connection): Promise<void> {
  await db.execute("DELETE FROM rami_message");
  await db.execute("DELETE FROM rami_stop_monitoring_message");
  await db.execute("DELETE FROM rami_udot");
  await db.execute("DELETE FROM rami_udot_history");
}

export async function expectRowCount(
  expectedCount: number,
  sql: string,
): Promise<void> {
  await inTransaction(async (conn) => {
    const [rows] = await conn.query(sql);

    expect(rows).toHaveLength(1);
    // MySQL returns COUNT(*) in uppercase, but also check lowercase for compatibility
    const count: number =
      (get(rows, ["0", "COUNT(*)"]) ?? get(rows, ["0", "count(*)"])) as number;
    expect(count).toEqual(expectedCount);
  });
}

export interface TestConfiguration {
  beforeAll?: (db: Connection) => Promise<void>;
  afterAll?: (db: Connection) => Promise<void>;
  beforeEach?: (db: Connection) => Promise<void>;
}

export function dbTestBase(
  fn: JestEmptyFunction,
  config?: TestConfiguration,
): JestEmptyFunction {
  return () => {
    beforeAll(async () => {
      await mysql.inTransaction(async (db) => {
        await truncate(db);
        if (config?.beforeAll) {
          await config.beforeAll(db);
        }
      });
    });

    afterAll(async () => {
      await mysql.inTransaction(async (db) => {
        await truncate(db);
        if (config?.afterAll) {
          await config.afterAll(db);
        }
      });
    });

    beforeEach(async () => {
      await mysql.inTransaction(async (db) => {
        await truncate(db);
        if (config?.beforeEach) {
          await config.beforeEach(db);
        }
      });
    });

    fn();
  };
}
