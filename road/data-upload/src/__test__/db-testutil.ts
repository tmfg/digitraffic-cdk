import { dbTestBase as commonDbTestBase } from "@digitraffic/common/dist/test/db-testutils";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import type { Countable } from "@digitraffic/common/dist/database/models";
import { setEnvVariable } from "@digitraffic/common/dist/utils/utils";

setEnvVariable("SECRET_ID", "TEST");

export function dbTestBase(fn: (db: DTDatabase) => void): () => void {
  return commonDbTestBase(fn, truncate, "road", "road", "localhost:54322/road");
}

function truncate(db: DTDatabase): Promise<void> {
  return db.tx(async (t) => {
    await t.none("DELETE FROM data_incoming");
  });
}

export async function assertDataCount(
  db: DTDatabase,
  expectedCount: number,
  status?: string,
): Promise<void> {
  const sql =
    "select count(*) as count from data_incoming where ($1 is null or status=$1)";
  const dataCount: Countable = await db.one(sql, [status]);

  expect(dataCount.count).toEqual(expectedCount);
}
