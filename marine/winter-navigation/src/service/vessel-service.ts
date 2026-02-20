import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { inDatabaseReadonly } from "@digitraffic/common/dist/database/database";
import * as LastUpdatedDB from "@digitraffic/common/dist/database/last-updated";
import * as VesselDB from "../db/vessels.js";
import { VESSEL_CHECK } from "../keys.js";
import type { ActivityDTO, QueueDTO, VesselDTO } from "../model/dto-model.js";
import type {
  Activity,
  PlannedAssistance,
  Vessel,
  VesselsResponse,
} from "../model/public-api-model.js";

export function getVessel(
  vesselId: number,
  activeFrom?: Date,
  activeTo?: Date,
): Promise<[Vessel | undefined, Date | undefined]> {
  return inDatabaseReadonly(async (db: DTDatabase) => {
    const vessel = await VesselDB.getVessel(db, vesselId, activeFrom, activeTo);
    const lastUpdated = await LastUpdatedDB.getUpdatedTimestamp(
      db,
      VESSEL_CHECK,
    );

    if (!vessel) {
      return Promise.resolve([undefined, lastUpdated ?? undefined]);
    }

    const dtVessel = convertVessel(vessel, lastUpdated ?? undefined);

    return [dtVessel, lastUpdated ?? undefined];
  });
}

export function getVessels(
  activeFrom?: Date,
  activeTo?: Date,
): Promise<[VesselsResponse, Date | undefined]> {
  return inDatabaseReadonly(async (db: DTDatabase) => {
    const vessels = await VesselDB.getVessels(db, activeFrom, activeTo);
    const lastUpdated = await LastUpdatedDB.getUpdatedTimestamp(
      db,
      VESSEL_CHECK,
    );
    const dtVessels = vessels
      .filter(
        (v) =>
          (!!v.queues && v.queues.length > 0) ||
          (!!v.activities && v.activities.length > 0),
      )
      .map((v) => convertVessel(v));
    const response = {
      lastUpdated: lastUpdated?.toISOString() ?? null,
      vessels: dtVessels,
    };
    return [response, lastUpdated ?? undefined];
  });
}

function convertVessel(v: VesselDTO, lastUpdated?: Date): Vessel {
  return {
    name: v.name,
    callSign: v.callsign ?? null,
    shortcode: v.shortcode ?? null,
    mmsi: v.mmsi ?? null,
    imo: v.imo ?? null,
    type: v.type ?? null,
    activities:
      v.activities && v.activities.length > 0
        ? v.activities.map((a): Activity => convertActivity(a, v))
        : [],
    plannedAssistances:
      v.queues && v.queues.length > 0
        ? v.queues.map((q): PlannedAssistance => convertQueue(q, v))
        : [],
    // lastUpdated should be left out from responses containing multiple vessels (a single property should be placed in response root instead)
    ...(lastUpdated && { lastUpdated: lastUpdated.toISOString() }),
  };
}

function convertActivity(a: ActivityDTO, v: VesselDTO): Activity {
  const isIcebreaker =
    v.mmsi === a.icebreaker_mmsi || v.imo === a.icebreaker_imo;
  const isVessel = v.mmsi === a.vessel_mmsi || v.imo === a.vessel_imo;
  const baseActivity = {
    type: a.type,
    reason: a.reason ?? null,
    publicComment: a.public_comment ?? null,
    startTime: a.start_time,
    endTime: a.end_time ?? null,
  };
  // If this activity concerns both an assisted vessel and an assisting icebreaker and
  // the current vessel is not the icebreaker, the property assistingVessel is set.
  // In the opposite situation (current vessel is icebreaker), the property assistedVessel is set.
  if (isVessel && !!a.icebreaker_id) {
    return {
      ...baseActivity,
      assistingVessel: {
        imo: a.icebreaker_imo ?? null,
        mmsi: a.icebreaker_mmsi ?? null,
        name: a.icebreaker_name,
      },
    };
  }

  if (isIcebreaker && !!a.vessel_id) {
    return {
      ...baseActivity,
      assistedVessel: {
        imo: a.vessel_imo ?? null,
        mmsi: a.vessel_mmsi ?? null,
        name: a.vessel_name,
      },
    };
  }

  // In this case current activity concerns only a single vessel (or icebreaker)
  return baseActivity;
}

function convertQueue(q: QueueDTO, v: VesselDTO): PlannedAssistance {
  const isIcebreaker =
    v.mmsi === q.icebreaker_mmsi || v.imo === q.icebreaker_imo;

  const baseAssistance = {
    queuePosition: q.order_num,
    startTime: q.start_time,
    endTime: q.end_time ?? null,
  };

  // leave out from the assistance object redundant reference to current vessel
  if (isIcebreaker) {
    return {
      assistedVessel: {
        imo: q.vessel_imo ?? null,
        mmsi: q.vessel_mmsi ?? null,
        name: q.vessel_name,
      },
      ...baseAssistance,
    };
  } else {
    return {
      assistingVessel: {
        imo: q.icebreaker_imo ?? null,
        mmsi: q.icebreaker_mmsi ?? null,
        name: q.icebreaker_name,
      },
      ...baseAssistance,
    };
  }
}
