import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import pgPromise from "pg-promise";
import type { Pilotage } from "../model/pilotage.js";
import type { Location } from "../model/timestamp.js";

export const PORTCALL_TIMESTAMP_AGE_LIMIT = `NOW() - INTERVAL '36 HOURS'`;

const GET_ACTIVE_PILOTAGE_TIMESTAMPS_SQL =
  "select id, schedule_updated from pilotage where state != 'FINISHED'";
const GET_ACTIVE_PILOTAGE_TIMESTAMPS_PS = new pgPromise.PreparedStatement({
  name: "get-active-pilotage-timestamps",
  text: GET_ACTIVE_PILOTAGE_TIMESTAMPS_SQL,
});

const UPSERT_PILOTAGES_SQL = `insert into pilotage(id, vessel_imo, vessel_mmsi, vessel_eta, pilot_boarding_time, pilotage_end_time, schedule_updated, schedule_source, state, 
    vessel_name, start_code, start_berth, end_code, end_berth)
values($(id), $(vesselImo), $(vesselMmsi), $(vesselEta), $(pilotBoardingTime), $(endTime), $(scheduleUpdated), $(scheduleSource), $(state), $(vesselName), $(routeStart), 
    $(routeStartBerth), $(routeEnd), $(routeEndBerth))
on conflict(id) do update set
    vessel_imo = $(vesselImo),
    vessel_mmsi = $(vesselMmsi),
    vessel_eta = $(vesselEta),
    pilot_boarding_time = $(pilotBoardingTime),
    pilotage_end_time = $(endTime),
    schedule_updated = $(scheduleUpdated),
    schedule_source = $(scheduleSource),    
    state = $(state),
    vessel_name = $(vesselName),
    start_code = $(routeStart), 
    start_berth = $(routeStartBerth), 
    end_code = $(routeEnd), 
    end_berth = $(routeEndBerth)
`;

const DELETE_PILOTAGES_SQL = `
    delete from pilotage
    where id in ($1:list)
    returning id
`;

const FIND_PORTCALL_SQL = `
    SELECT pc.port_call_id
    FROM public.port_call pc
    WHERE
        (
            pc.mmsi = COALESCE(
                    $1,
                    (SELECT DISTINCT FIRST_VALUE(mmsi) OVER (ORDER BY timestamp DESC) FROM public.vessel WHERE imo = $2),
                    (SELECT DISTINCT FIRST_VALUE(mmsi) OVER (ORDER BY port_call_timestamp DESC) FROM public.port_call WHERE imo_lloyds = $2)
            )
            OR
            pc.imo_lloyds = COALESCE(
                    $2,
                    (SELECT DISTINCT FIRST_VALUE(imo) OVER (ORDER BY timestamp DESC) FROM public.vessel WHERE mmsi = $1),
                    (SELECT DISTINCT FIRST_VALUE(imo_lloyds) OVER (ORDER BY port_call_timestamp DESC) FROM public.port_call WHERE mmsi = $1)
            )
        )  
        AND pc.port_to_visit = $3::CHARACTER VARYING(5)
        AND pc.port_call_timestamp > (${PORTCALL_TIMESTAMP_AGE_LIMIT})
        LIMIT 1
`;

export interface DbPilotageTimestamp {
  readonly id: number;
  readonly schedule_updated: Date;
}

interface DbPortcallId {
  readonly port_call_id: number;
}

export type TimestampMap = Map<number, Date>;

export async function findPortCallId(
  db: DTDatabase,
  pilotage: Pilotage,
  location: Location,
): Promise<number | undefined> {
  const p1 = await db.oneOrNone<DbPortcallId>(FIND_PORTCALL_SQL, [
    pilotage.vessel.mmsi,
    pilotage.vessel.imo,
    location.port,
  ]);
  const p2 = await db.oneOrNone<DbPortcallId>(FIND_PORTCALL_SQL, [
    pilotage.vessel.mmsi,
    pilotage.vessel.imo,
    location.from,
  ]);

  if (p1 && p2 && location.port !== location.from) {
    logger.info({
      method: "PilotwebService.convertUpdatedTimestamps",
      message: `portcall found for ${location.port}${
        location.from ? ` and ${location.from}` : ""
      }`,
    });
    return p2.port_call_id;
  }

  if (!p1 && !p2) {
    logger.info({
      method: "PilotwebService.convertUpdatedTimestamps",
      message: `no portcall found for ${location.port}${
        location.from ? ` or ${location.from}` : ""
      }`,
    });
  } else if (p1) {
    return p1.port_call_id;
  } else if (p2) {
    return p2.port_call_id;
  }

  return undefined;
}

export async function getTimestamps(db: DTDatabase): Promise<TimestampMap> {
  const timestamps = await db.manyOrNone<DbPilotageTimestamp>(
    GET_ACTIVE_PILOTAGE_TIMESTAMPS_PS,
  );
  const idMap: TimestampMap = new Map();

  timestamps.forEach((ts) => {
    idMap.set(ts.id, ts.schedule_updated);
  });

  return idMap;
}

export function updatePilotages(
  db: DTDatabase,
  pilotages: Pilotage[],
): Promise<unknown> {
  if (pilotages.length > 0) {
    return Promise.all(
      pilotages.map((pilotage) =>
        db.none(UPSERT_PILOTAGES_SQL, {
          id: pilotage.id,
          vesselImo: pilotage.vessel.imo,
          vesselMmsi: pilotage.vessel.mmsi,
          vesselEta: pilotage.vesselEta,
          pilotBoardingTime: pilotage.pilotBoardingTime,
          endTime: pilotage.endTime,
          scheduleUpdated: pilotage.scheduleUpdated,
          scheduleSource: pilotage.scheduleSource,
          state: pilotage.state,
          vesselName: pilotage.vessel.name,
          routeStart: pilotage.route.start.code,
          routeStartBerth: pilotage.route.start.berth?.code,
          routeEnd: pilotage.route.end.code,
          routeEndBerth: pilotage.route.end.berth?.code,
        }),
      ),
    );
  }

  return Promise.resolve();
}

export function deletePilotages(
  db: DTDatabase,
  pilotageIds: number[],
): Promise<number[]> {
  if (pilotageIds.length > 0) {
    return db.manyOrNone<number>(DELETE_PILOTAGES_SQL, [pilotageIds]);
  }

  return Promise.resolve([]);
}
