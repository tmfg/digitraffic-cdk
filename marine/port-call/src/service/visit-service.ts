import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import {
  inDatabase,
  inDatabaseReadonly,
} from "@digitraffic/common/dist/database/database";
import { updateUpdatedTimestamp } from "@digitraffic/common/dist/database/last-updated";
import { addDays, startOfDay, subDays } from "date-fns";
import { NemoApi } from "../api/nemo-api.js";
import type { DbInsertedUpdated, DbVisit } from "../db/visits.js";
import { findAllVisits, findVisit, upsertVisits } from "../db/visits.js";
import type { GetVisitsParameters } from "../lambda/get-visits/get-visits.js";
import type { VisitResponse } from "../model/visit-schema.js";

const DATATYPE = "PC2_VISITS" as const;

const UPDATE_DAYS_TO_FUTURE = 100 as const;

interface UpdateInfo extends DbInsertedUpdated {
  readonly items: number;
}

// what format? json or geojson?
export async function getAllVisits(
  getVisitsEvent: GetVisitsParameters,
): Promise<[VisitResponse[], Date]> {
  const visits = await inDatabaseReadonly((db: DTDatabase) => {
    return findAllVisits(db, getVisitsEvent.from, getVisitsEvent.to);
  });

  // get from visits
  return [visits.map(convertVisit), new Date()];
}

function convertVisit(dbVisit: DbVisit): VisitResponse {
  return {
    visitId: dbVisit.visit_id,
    vesselId: dbVisit.vessel_id,
    vesselName: dbVisit.vessel_name,
    portLocode: dbVisit.port_locode,
    eta: dbVisit.eta.toISOString(),
    etd: dbVisit.etd?.toISOString(),
    ata: dbVisit.ata?.toISOString(),
    atd: dbVisit.atd?.toISOString(),
    status: dbVisit.status,
    updateTime: dbVisit.update_time.toISOString(),
  };
}

export async function getVisit(
  visitId: string,
): Promise<[VisitResponse | undefined, Date]> {
  const visit = await inDatabaseReadonly((db: DTDatabase) => {
    return findVisit(db, visitId);
  });

  if (!visit) {
    return Promise.resolve([undefined, new Date()]);
  }

  return Promise.resolve([convertVisit(visit), visit.update_time]);
}

function getDaysToUpdate(dayCount: number): Date[] {
  const yesterday = subDays(new Date(), 1);

  const days: Date[] = [];
  for (let i = 0; i <= dayCount; i++) {
    const day = addDays(yesterday, i);
    days.push(day);
  }

  return days;
}

async function updateVisitsForDay(
  api: NemoApi,
  day: Date,
): Promise<UpdateInfo> {
  const from = startOfDay(day);
  const to = addDays(from, 1);
  const response = await api.getVisits(from, to);

  if (response.length === 0) {
    return {
      inserted: 0,
      updated: 0,
      items: 0,
    };
  }

  return await inDatabase(async (db: DTDatabase) => {
    const updated = await upsertVisits(db, response);

    return {
      inserted: updated.inserted,
      updated: updated.updated,
      items: response.length,
    };
  });
}

export async function updateVisits(
  url: string,
  privateKey: string,
  certificate: string,
  dayCount: number = UPDATE_DAYS_TO_FUTURE,
): Promise<UpdateInfo> {
  const api = new NemoApi(url, privateKey, certificate);
  const daysToUpdate = getDaysToUpdate(dayCount);

  let updatedCount = 0;
  let insertedCount = 0;
  let itemCount = 0;

  for (const day of daysToUpdate) {
    const updated = await updateVisitsForDay(api, day);

    logger.info({
      method: "VisitService.updateVisits",
      customDate: day.toISOString().substring(0, 10),
      customUpdatedCount: updated.updated,
      customInsertedCount: updated.inserted,
      customItemCount: updated.items,
    });

    updatedCount += updated.updated;
    insertedCount += updated.inserted;
    itemCount += updated.items;
  }

  await inDatabase(async (db: DTDatabase) => {
    await updateUpdatedTimestamp(db, DATATYPE, new Date());
  });

  return {
    inserted: insertedCount,
    updated: updatedCount,
    items: itemCount,
  };
}
