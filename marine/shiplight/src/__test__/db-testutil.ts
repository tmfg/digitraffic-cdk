import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { dbTestBase as commonDbTestBase } from "@digitraffic/common/dist/test/db-testutils";
import { ShipTypes } from "../db/areatraffic.js";

export function dbTestBase(fn: (db: DTDatabase) => void): () => void {
  return commonDbTestBase(
    fn,
    truncate,
    "marine",
    "marine",
    "localhost:54321/marine",
  );
}

interface Area {
  brighten_sent?: Date;
  brighten_end?: Date;
}

export async function assertArea(
  db: DTDatabase,
  id: number,
  duration?: number,
): Promise<void> {
  const area = await db.tx((t) => {
    return t.oneOrNone<Area | null>(
      "select brighten_sent,brighten_end from areatraffic where id = $1",
      [id],
    );
  });

  if (duration) {
    if (!area) fail("area not defined");
    if (!area.brighten_sent) fail("brighten_sent not defined");
    if (!area.brighten_end) fail("brighten_end not defined");

    const sent = new Date(area.brighten_sent);
    const end = new Date(area.brighten_end);

    expect(end.getTime() - sent.getTime()).toEqual(duration * 60 * 1000);
  } else {
    expect(area).toBeNull();
  }
}

export async function insertAreaTraffic(
  db: DTDatabase,
  id: number,
  name: string,
  duration: number,
  geometry: string,
): Promise<void> {
  await db.tx(async (t) => {
    await t.none(
      "INSERT INTO areatraffic(id,name,brighten_duration_min,geometry) values ($1, $2, $3, $4)",
      [id, name, duration, geometry],
    );
  });
}

export async function insertVessel(
  db: DTDatabase,
  mmsi: number,
  shipName: string = "test_vessel",
): Promise<void> {
  await db.tx(async (t) => {
    await t.none(
      "INSERT INTO vessel(mmsi,timestamp,name,ship_type,reference_point_a,reference_point_b,reference_point_c,reference_point_d,pos_type,draught,imo,eta) " +
        "values ($1, $2, $3, $4, 1,1,1,1,1,1,1,1)",
      [mmsi, Date.now(), shipName, ShipTypes.CARGO],
    );
  });
}

export async function insertVesselLocation(
  db: DTDatabase,
  mmsi: number,
  timestamp: number,
  x: number,
  speed: number = 3,
): Promise<void> {
  await db.tx(async (t) => {
    await t.none(
      "INSERT INTO vessel_location(mmsi,timestamp_ext,x,y,sog,cog,nav_stat,rot,pos_acc,raim,timestamp) " +
        "values ($1, $2, $3, $4, $5, 1, 1, 1, true, true, 1)",
      [mmsi, timestamp, x, 1, speed],
    );
  });
}

async function truncate(db: DTDatabase): Promise<void> {
  await db.tx(async (t) => {
    await t.none("DELETE FROM areatraffic");
    await t.none("DELETE FROM vessel_location");
    await t.none("DELETE FROM vessel");
  });
}
