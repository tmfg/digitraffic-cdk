import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { default as pgPromise } from "pg-promise";

export interface DbAreaTraffic {
  readonly id: number;
  readonly name: string;
  readonly brighten_duration_min: number;
  readonly brighten_sent?: Date;
  readonly brighten_end?: Date;
}

export interface DbAreaTrafficResult extends DbAreaTraffic {
  readonly ship_mmsi: number;
  readonly ship_name: string;
}

export enum ShipTypes {
  FISHING = 30,
  CARGO = 70,
}

const SHIP_MOVING_INTERVAL = "2 MINUTE";

export const SHIP_SPEED_THRESHOLD_KNOTS = 2;
export const SHIP_SPEED_NOT_AVAILABLE = 102.3;

const SQL_GET_AREA_TRAFFIC = `
    SELECT DISTINCT ON (at.id)
        at.id,
        at.name,
        at.brighten_duration_min,
        at.brighten_sent,
        at.brighten_end,
        v.mmsi as ship_mmsi,
        v.name as ship_name
    FROM areatraffic at
    JOIN vessel_location vl ON ST_INTERSECTS(at.geometry, ST_MAKEPOINT(vl.x, vl.y))
    JOIN vessel v on vl.mmsi = v.mmsi 
    WHERE TO_TIMESTAMP(vl.timestamp_ext / 1000) >= (NOW() - INTERVAL '${SHIP_MOVING_INTERVAL}')
    AND (vl.sog > ${SHIP_SPEED_THRESHOLD_KNOTS} AND vl.sog != ${SHIP_SPEED_NOT_AVAILABLE})
    ORDER BY at.id, ship_name ASC
`.trim();

const SQL_UPDATE_AREA_TRAFFIC_SENDTIME = `
    UPDATE areatraffic
    SET brighten_sent = NOW(),
        brighten_end = (NOW() + (INTERVAL '1 MINUTE' * brighten_duration_min))
        where id = $1
`.trim();

const PS_GET_AREA_TRAFFIC = new pgPromise.PreparedStatement({
  name: "get-area-traffic",
  text: SQL_GET_AREA_TRAFFIC,
});

const PS_UPDATE_AREA_TRAFFIC_SENDTIME = new pgPromise.PreparedStatement({
  name: "update-area-traffic-sendtime",
  text: SQL_UPDATE_AREA_TRAFFIC_SENDTIME,
});

export function getAreaTraffic(db: DTDatabase): Promise<DbAreaTrafficResult[]> {
  return db.manyOrNone(PS_GET_AREA_TRAFFIC);
}

export async function updateAreaTrafficSendTime(
  db: DTDatabase,
  areaId: number,
): Promise<void> {
  await db.none(PS_UPDATE_AREA_TRAFFIC_SENDTIME, [areaId]);
}
