import { dbTestBase as commonDbTestBase } from "@digitraffic/common/dist/test/db-testutils";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import type { Countable } from "@digitraffic/common/dist/database/models";
import { setEnvVariable } from "@digitraffic/common/dist/utils/utils";
import type { DataStatus } from "../model/types.js";

setEnvVariable("SECRET_ID", "TEST");

export function dbTestBase(fn: (db: DTDatabase) => void): () => void {
  return commonDbTestBase(fn, truncate, "road", "road", "localhost:54322/road");
}

function truncate(db: DTDatabase): Promise<void> {
  return db.tx(async (t) => {
    await t.none("DELETE FROM data_incoming");
    await t.none("DELETE FROM device_data_datex2");
  });
}

export async function assertDataCount(
  db: DTDatabase,
  expectedCount: number,
  status?: DataStatus,
): Promise<void> {
  const sql =
    "select count(*) as count from data_incoming where ($1 is null or status=$1)";
  const dataCount: Countable = await db.one(sql, [status]);

  expect(dataCount.count).toEqual(expectedCount);
}

export async function assertRttiDatex2Count(
  db: DTDatabase,
  expectedCount: number,
): Promise<void> {
  const sql =
    "select count(*) as count from datex2_rtti";
  const dataCount: Countable = await db.one(sql);

  expect(dataCount.count).toEqual(expectedCount);
}

export async function assertVsDatex2Count(
  db: DTDatabase,
  expectedCount: number,
): Promise<void> {
  const sql = "select count(*) as count from device_data_datex2";
  const dataCount: Countable = await db.one(sql);

  expect(dataCount.count).toEqual(expectedCount);
}
