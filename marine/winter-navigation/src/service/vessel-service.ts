import {
  type DTDatabase,
  inDatabaseReadonly,
} from "@digitraffic/common/dist/database/database";
import * as VesselDB from "../db/vessels.js";
import type { ActivityDTO, QueueDTO, VesselDTO } from "../model/dto-model.js";
import type {
  Activity,
  PlannedAssistance,
  Vessel,
} from "../model/public-api-model.js";

export function getVessel(
  vesselId: number,
  activeFrom?: Date,
  activeTo?: Date,
): Promise<[Vessel | undefined, Date | undefined]> {
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
): Promise<[Vessel[], Date | undefined]> {
  return inDatabaseReadonly(async (db: DTDatabase) => {
    const vessels = await VesselDB.getVessels(db, activeFrom, activeTo);
    const lastUpdated = undefined;

    const dtVessels = vessels
      .filter((v) =>
        (!!v.queues && v.queues.length > 0) ||
        (!!v.activities && v.activities.length > 0)
      )
      .map(convertVessel);
    return [dtVessels, lastUpdated ?? undefined];
  });
}

function convertVessel(
  v: VesselDTO,
): Vessel {
  return {
    name: v.name,
    ...(v.callsign && { callSign: v.callsign }),
    ...(v.shortcode && { shortcode: v.shortcode }),
    ...(v.mmsi && { mmsi: v.mmsi }),
    ...(v.imo && { imo: v.imo }),
    ...(v.type && { type: v.type }),
    ...(v.activities && v.activities.length > 0 && {
      activities: v.activities.map((a): Activity => convertActivity(a, v)),
    }),
    ...(v.queues && v.queues.length > 0 && {
      plannedAssistances: v.queues.map((q): PlannedAssistance =>
        convertQueue(q, v)
      ),
    }),
  };
}

function convertActivity(a: ActivityDTO, v: VesselDTO): Activity {
  const isIcebreaker = v.mmsi === a.icebreaker_mmsi ||
    v.imo === a.icebreaker_imo;
  const isVessel = v.mmsi === a.vessel_mmsi || v.imo === a.vessel_imo;
  const baseActivity = {
    type: a.type,
    ...(a.reason && { reason: a.reason }),
    ...(a.public_comment && { publicComment: a.public_comment }),
    startTime: a.start_time,
    ...(a.end_time && { endTime: a.end_time }),
  };
  // If this activity concerns both an assisted vessel and an assisting icebreaker and
  // the current vessel is not the icebreaker, the property assistingVessel is set.
  // In the opposite situation (current vessel is icebreaker), the property assistedVessel is set.
  if (isVessel && !!a.icebreaker_id) {
    return {
      ...baseActivity,
      assistingVessel: {
        ...(a.icebreaker_imo && { imo: a.icebreaker_imo }),
        ...(a.icebreaker_mmsi && { mmsi: a.icebreaker_mmsi }),
        name: a.icebreaker_name,
      },
    };
  }

  if (isIcebreaker && !!a.vessel_id) {
    return {
      ...baseActivity,
      assistedVessel: {
        ...(a.vessel_imo && { imo: a.vessel_imo }),
        ...(a.vessel_mmsi && { mmsi: a.vessel_mmsi }),
        name: a.vessel_name,
      },
    };
  }

  // In this case current activity concerns only a single vessel (or icebreaker)
  return baseActivity;
}

function convertQueue(q: QueueDTO, v: VesselDTO): PlannedAssistance {
  const isIcebreaker = v.mmsi === q.icebreaker_mmsi ||
    v.imo === q.icebreaker_imo;

  const baseAssistance = {
    queuePosition: q.order_num,
    startTime: q.start_time,
    ...(q.end_time && { endTime: q.end_time }),
  };

  // leave out from the assistance object redundant reference to current vessel
  if (isIcebreaker) {
    return {
      assistedVessel: {
        ...(q.vessel_imo && { imo: q.vessel_imo }),
        ...(q.vessel_mmsi && { mmsi: q.vessel_mmsi }),
        name: q.vessel_name,
      },
      ...baseAssistance,
    };
  } else {
    return {
      assistingVessel: {
        ...(q.icebreaker_imo && { imo: q.icebreaker_imo }),
        ...(q.icebreaker_mmsi && { mmsi: q.icebreaker_mmsi }),
        name: q.icebreaker_name,
      },
      ...baseAssistance,
    };
  }
}
