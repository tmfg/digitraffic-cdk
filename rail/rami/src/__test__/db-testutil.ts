import { get } from "lodash-es";
import type { Connection } from "mysql2/promise";
import { afterAll, beforeAll, beforeEach, expect } from "vitest";
import { inTransaction } from "../util/database.js";

export type DbUnitTestFunction = (db: Connection) => void;

type EmptyFunction = () => void;

// biome-ignore lint/complexity/useLiteralKeys: nope
process.env["AWS_REGION"] = "eu-west-1";

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
    expect(get(rows, ["0", "count(*)"])).toEqual(expectedCount);
  });
}

export interface TestConfiguration {
  beforeAll?: (db: Connection) => Promise<void>;
  afterAll?: (db: Connection) => Promise<void>;
  beforeEach?: (db: Connection) => Promise<void>;
}

export function dbTestBase(
  fn: EmptyFunction,
  config?: TestConfiguration,
): EmptyFunction {
  return () => {
    beforeAll(async () => {
      await inTransaction(async (db) => {
        await truncate(db);
        if (config?.beforeAll) {
          await config.beforeAll(db);
        }
      });
    });

    afterAll(async () => {
      await inTransaction(async (db) => {
        await truncate(db);
        if (config?.afterAll) {
          await config.afterAll(db);
        }
      });
    });

    beforeEach(async () => {
      await inTransaction(async (db) => {
        await truncate(db);
        if (config?.beforeEach) {
          await config.beforeEach(db);
        }
      });
    });

    fn();
  };
}
