import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { DataType } from "@digitraffic/common/dist/database/last-updated";
import { dbTestBase as commonDbTestBase } from "@digitraffic/common/dist/test/db-testutils";

export function dbTestBase(fn: (db: DTDatabase) => void): () => void {
  return commonDbTestBase(fn, truncate, "road", "road", "localhost:54322/road");
}

function truncate(db: DTDatabase): Promise<void> {
  return db.tx(async (t) => {
    await t.none("DELETE FROM data_updated");
    await t.none("DELETE FROM cs2_site");
    await t.none("DELETE FROM cs2_data");
  });
}

export async function insertCounter(
  db: DTDatabase,
  id: number,
  domainName: string,
  userType: number,
): Promise<void> {
  await db.tx((t) => {
    return t.none(
      `
                insert into counting_site_counter(id, site_id, domain_name, name, site_domain, location, user_type_id, "interval", direction, last_data_timestamp)
                values(
                       $1, $1,
                       $2, 'name', 'DOMAIN', 'POINT(10 10)',
                       $3, 15, 1, current_timestamp - interval '3 days')
            `,
      [id, domainName, userType],
    );
  });
}
export async function insertData(
  db: DTDatabase,
  counterId: number,
  count: number,
): Promise<void> {
  await db.tx((t) => {
    return t.none(
      `insert into counting_site_data(id, counter_id, data_timestamp, count, interval)
                       values (NEXTVAL('counting_site_data_id_seq'), $1, '2021-10-31T00:00:00' , $2, 15)       
            `,
      [counterId, count],
    );
  });
}

export async function insertLastUpdated(
  db: DTDatabase,
  id: number,
  updated: Date,
): Promise<void> {
  await db.tx((t) => {
    return t.none(
      `
                insert into data_updated(id, data_type, updated)
                values($1, $2, $3)                
            `,
      [id, DataType.COUNTING_SITES_DATA, updated],
    );
  });
}
