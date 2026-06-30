import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import {
  assertCount,
  dbTestBase as commonDbTestBase,
} from "@digitraffic/common/dist/test/db-testutils";
import { vi } from "vitest";
import type { TableName } from "../db/deleted.js";

export function dbTestBase(fn: (db: DTDatabase) => void): () => void {
  return commonDbTestBase(
    fn,
    truncate,
    "marine",
    "marine",
    "127.0.0.1:54321/marine",
  );
}

async function truncate(db: DTDatabase): Promise<void> {
  // Run all DELETEs as a single multi-statement query. Building an array of
  // already-invoked t.none(...) promises (e.g. via t.batch) fires every query
  // concurrently on the same connection, which triggers the pg
  // "client is already executing a query" deprecation warning.
  await db.none(
    `DELETE FROM wn_location;
     DELETE FROM wn_restriction;
     DELETE FROM wn_vessel;
     DELETE FROM wn_activity;
     DELETE FROM wn_source;
     DELETE FROM wn_queue;
     DELETE FROM wn_dirway;
     DELETE FROM wn_dirwaypoint;
     DELETE FROM wn_port_suspension;
     DELETE FROM wn_port_suspension_location;`,
  );
}

export async function assertCountFromTable(
  db: DTDatabase,
  tableName: TableName,
  count: number,
  deletedCount: number = 0,
): Promise<void> {
  await assertCount(db, `select count(*) from ${tableName}`, count);
  await assertCount(
    db,
    `select count(*) from ${tableName} where deleted = true`,
    deletedCount,
  );
}

export async function mockProxyHolder(): Promise<void> {
  vi.resetModules();
  const { ProxyHolder } = await import(
    "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder"
  );
  vi.spyOn(ProxyHolder.prototype, "setCredentials").mockImplementation(
    async () => Promise.resolve(),
  );
}
