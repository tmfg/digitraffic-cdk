import {
  type DTDatabase,
  inDatabaseReadonly,
} from "@digitraffic/common/dist/database/database";
import type {
  DTActivity,
  DTVessel,
  PlannedAssistance,
} from "../model/dt-apidata.js";
import * as VesselDB from "../db/vessels.js";
import type { Activity, Queue, Vessel } from "../model/apidata.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

export function getVessel(
  vesselId: number,
  activeFrom?: Date,
  activeTo?: Date,
): Promise<[DTVessel | undefined, Date | undefined]> {
  return inDatabaseReadonly(async (db: DTDatabase) => {
    const vessel = await VesselDB.getVessel(db, vesselId, activeFrom, activeTo);
    const lastUpdated = undefined;

    if (!vessel) {
      return Promise.resolve([undefined, lastUpdated ?? undefined]);
    }

    const dtVessel = convertVessel(vessel);

    return [dtVessel, lastUpdated ?? undefined];
  });
}

export function getVessels(
  activeFrom?: Date,
  activeTo?: Date,
): Promise<[DTVessel[], Date | undefined]> {
  return inDatabaseReadonly(async (db: DTDatabase) => {
    const vessels = await VesselDB.getVessels(db, activeFrom, activeTo);
    const lastUpdated = undefined;

    const dtVessels = vessels
      .filter((v) =>
        (!!v.queues && v.queues.length > 0) ||
        (!!v.activities && v.activities.length > 0)
      )
      .map(convertVessel);

    logger.info({
      method: "GetVessels.getVessels",
      message: JSON.stringify(dtVessels),
    });
    return [dtVessels, lastUpdated ?? undefined];
  });
}

function convertVessel(
  v: Vessel,
): DTVessel {
  return {
    name: v.name,
    callSign: v.callsign,
    shortcode: v.shortcode,
    mmsi: v.mmsi,
    imo: v.imo,
    type: v.type,
    ...(v.activities && v.activities.length > 0 && {
      activities: v.activities.map((a): DTActivity => convertActivity(a, v)),
    }),
    ...(v.queues && v.queues.length > 0 && {
      plannedAssistances: v.queues.map((q): PlannedAssistance =>
        convertQueue(q, v)
      ),
    }),
  };
}

function convertActivity(a: Activity, v: Vessel): DTActivity {
  const isIcebreaker = v.mmsi === a.icebreaker_mmsi ||
    v.imo === a.icebreaker_imo;
  const isVessel = v.mmsi === a.vessel_mmsi || v.imo === a.vessel_imo;

  const baseActivity = {
    type: a.type,
    reason: a.reason,
    publicComment: a.public_comment,
    startTime: a.start_time,
    endTime: a.end_time,
  };
  // activity concerns both assisted vessel and assisting icebreaker
  if (isVessel && !!a.icebreaker_id) {
    return {
      ...baseActivity,
      assistingVessel: {
        imo: a.icebreaker_imo,
        mmsi: a.icebreaker_mmsi,
        name: a.icebreaker_name,
      },
    };
  }

  // activity concerns both assisted vessel and assisting icebreaker
  if (isIcebreaker && !!a.vessel_id) {
    return {
      ...baseActivity,
      assistedVessel: {
        imo: a.vessel_imo,
        mmsi: a.vessel_mmsi,
        name: a.vessel_name,
      },
    };
  }

  // activity concerns only a single vessel (or icebreaker)
  return baseActivity;
}

function convertQueue(q: Queue, v: Vessel): PlannedAssistance {
  const isIcebreaker = v.mmsi === q.icebreaker_mmsi ||
    v.imo === q.icebreaker_imo;

  const baseAssistance = {
    queuePosition: q.order_num,
    startTime: q.start_time,
    endTime: q.end_time,
  };

  // leave out from the assistance object redundant reference to current vessel
  if (isIcebreaker) {
    return {
      assistedVessel: {
        imo: q.vessel_imo,
        mmsi: q.vessel_mmsi,
        name: q.vessel_name,
      },
      ...baseAssistance,
    };
  } else {
    return {
      assistingVessel: {
        imo: q.icebreaker_imo,
        mmsi: q.icebreaker_mmsi,
        name: q.icebreaker_name,
      },
      ...baseAssistance,
    };
  }
}
