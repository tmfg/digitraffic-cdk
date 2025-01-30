import type { ApiData } from "../model/v2/api-model.js";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import type { DbCsvData, DbValues } from "../model/v2/db-model.js";
import type { TravelMode } from "../model/v2/types.js";
import { database } from "./db.js";

async function findLastModified(
  db: DTDatabase,
  startDate: Date,
  endDate: Date,
  siteId?: number,
  travelMode?: TravelMode,
): Promise<Date> {
  let creator = database.selectFrom("cs2_data")
    .select(({ fn }) => fn("max", ["modified"]).as("modified"))
    .where("data_timestamp", ">=", startDate)
    .where("data_timestamp", "<", endDate);

  if (siteId) creator = creator.where("site_id", "=", siteId);
  if (travelMode) creator = creator.where("travel_mode", "=", travelMode);

  const compiled = creator.compile();
  return (await db.one<DbModified>(compiled.sql, compiled.parameters))
    .modified ?? new Date();
}

export async function findValuesForDate(
  db: DTDatabase,
  date: Date,
  siteId?: number,
  travelMode?: TravelMode,
): Promise<[DbValues[], Date]> {
  // calculate timerange for data
  const startDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 1);

  const modified = await findLastModified(
    db,
    startDate,
    endDate,
    siteId,
    travelMode,
  );

  let creator = database.selectFrom("cs2_data")
    .select([
      "site_id",
      "travel_mode",
      "direction",
      "data_timestamp",
      "granularity",
      "counts",
    ])
    .where("data_timestamp", ">=", startDate)
    .where("data_timestamp", "<", endDate);

  if (siteId) creator = creator.where("site_id", "=", siteId);
  if (travelMode) creator = creator.where("travel_mode", "=", travelMode);

  creator = creator.orderBy([
    "site_id",
    "travel_mode",
    "direction",
    "data_timestamp",
  ]);

  const compiled = creator.compile();
  const data = await db.manyOrNone(compiled.sql, compiled.parameters);

  return [data, modified];
}

export async function findCsvValuesForMonth(
  db: DTDatabase,
  year: number,
  month: number,
  siteId: number,
  travelMode?: TravelMode,
): Promise<[DbCsvData[], Date]> {
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(new Date(startDate).setMonth(month));

  const modified = await findLastModified(
    db,
    startDate,
    endDate,
    siteId,
    travelMode,
  );

  let creator = database.selectFrom("cs2_data")
    .leftJoin("cs2_site", "cs2_data.site_id", "cs2_site.id")
    .select([
      "name",
      "travel_mode",
      "direction",
      "cs2_data.granularity",
      "data_timestamp",
      "counts",
    ])
    .where("data_timestamp", ">=", startDate)
    .where("data_timestamp", "<", endDate)
    .where("cs2_data.site_id", "=", siteId)
    .orderBy([
      "travel_mode",
      "direction",
      "cs2_data.granularity",
      "data_timestamp",
    ]);

  if (travelMode) creator = creator.where("travel_mode", "=", travelMode);

  const compiled = creator.compile();
  const data = await db.manyOrNone(compiled.sql, compiled.parameters);

  return [data, modified];
}

export async function addSiteData(
  db: DTDatabase,
  siteId: number,
  data: ApiData[],
): Promise<number> {
  let pointCount = 0;

  await Promise.all(data.map(async (d) => {
    await Promise.all(d.data.map((point) => {
      const compiled = database.insertInto("cs2_data")
        .values({
          site_id: siteId,
          travel_mode: d.travelMode,
          direction: d.direction,
          data_timestamp: point.timestamp,
          granularity: point.granularity,
          counts: point.counts,
        }).compile();

      pointCount++;

      return db.none(compiled.sql, compiled.parameters);
    }));
  }));

  return pointCount;
}

interface DbModified {
  readonly modified: Date;
}
