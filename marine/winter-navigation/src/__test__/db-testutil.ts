import {
  assertCount,
  dbTestBase as commonDbTestBase,
} from "@digitraffic/common/dist/test/db-testutils";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
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
  //return;
  await db.tx((t) => {
    return t.batch([
      t.none("DELETE FROM wn_location"),
      t.none("DELETE FROM wn_restriction"),
      t.none("DELETE FROM wn_vessel"),
      t.none("DELETE FROM wn_activity"),
      t.none("DELETE FROM wn_source"),
      t.none("DELETE FROM wn_queue"),
      t.none("DELETE FROM wn_dirway"),
      t.none("DELETE FROM wn_dirwaypoint"),
      t.none("DELETE FROM wn_port_suspension"),
      t.none("DELETE FROM wn_port_suspension_location"),
    ]);
  });
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
