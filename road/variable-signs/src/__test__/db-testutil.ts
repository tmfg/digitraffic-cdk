import { dbTestBase as commonDbTestBase } from "@digitraffic/common/dist/test/db-testutils";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";

export function dbTestBase(fn: (db: DTDatabase) => void): () => void {
  return commonDbTestBase(fn, truncate, "road", "road", "localhost:54322/road");
}

export async function setup(db: DTDatabase): Promise<void> {
  await db.tx((t) => {
    return t.batch([
      db.none(
        "insert into device(id,type,road_address) values('KRM015651','TEST', 'TEST')",
      ),
      db.none(
        "insert into device(id,type,road_address) values('KRM015511','TEST', 'TEST')",
      ),
    ]);
  });
}

export async function truncate(db: DTDatabase): Promise<void> {
  await db.tx(async (t) => {
    await t.none("delete from device");
    await t.none("delete from device_data_datex2");
    await t.none("delete from device_data_row");
    await t.none("delete from device_data");
  });
}
