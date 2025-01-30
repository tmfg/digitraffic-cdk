import {
  type DTDatabase,
  inDatabaseReadonly,
} from "@digitraffic/common/dist/database/database";
import { type FeatureCollection } from "geojson";
import { getSitesAsFeatureCollection } from "../dao/site.js";
import type { ResponseValue } from "../model/v2/response-model.js";
import { findCsvValuesForMonth, findValuesForDate } from "../dao/data.js";
import type { TravelMode } from "../model/v2/types.js";
import type { DbCsvData } from "../model/v2/db-model.js";
import { type Column, stringify } from "@std/csv";

export function getSites(
  siteId?: number,
  domain?: string,
): Promise<[FeatureCollection, Date]> {
  return inDatabaseReadonly((db: DTDatabase) => {
    return getSitesAsFeatureCollection(db, siteId, domain).then(
      (featureCollection) => {
        // FeatureCollection has nonstandard dataUpdatedTime field in sql query
        const collectionWithDataUpdatedTime = featureCollection as
          & FeatureCollection
          & {
            dataUpdatedTime: string;
          };
        const lastModified = new Date(
          collectionWithDataUpdatedTime.dataUpdatedTime,
        );
        return [featureCollection, lastModified];
      },
    );
  });
}

export function findSiteData(
  date: Date,
  siteId?: number,
  travelMode?: TravelMode,
): Promise<[ResponseValue[], Date]> {
  return inDatabaseReadonly(async (db: DTDatabase) => {
    const [data, lastModified] = await findValuesForDate(
      db,
      date,
      siteId,
      travelMode,
    );

    return [
      data.map(
        (row) =>
          ({
            siteId: row.site_id,
            travelMode: row.travel_mode,
            direction: row.direction,
            dataTimestamp: row.data_timestamp,
            granularity: row.granularity,
            count: row.counts,
          }) satisfies ResponseValue,
      ),
      lastModified,
    ];
  });
}

export function findSiteDataForMonth(
  year: number,
  month: number,
  siteId: number,
  travelMode?: TravelMode,
): Promise<[string, Date]> {
  return inDatabaseReadonly((db: DTDatabase) => {
    return findCsvValuesForMonth(db, year, month, siteId, travelMode);
  }).then(([data, lastModified]) => {
    const columns: Column[] = [
      { prop: "name", header: "SITE" },
      { prop: "travel_mode", header: "TRAVELMODE" },
      { prop: "timestamp", header: "TIMESTAMP" },
      { prop: "granularity", header: "GRANULARITY" },
      { prop: "direction", header: "DIRECTION" },
      { prop: "counts", header: "COUNT" },
    ];

    // overwrite timestamp to iso 8601
    const dataOut = data.map((row: DbCsvData) => {
      return {
        name: row.name,
        travel_mode: row.travel_mode,
        granularity: row.granularity,
        direction: row.direction,
        counts: row.counts,
        timestamp: row.data_timestamp.toISOString(),
      };
    });

    return [stringify(dataOut, { columns }), lastModified];
  });
}
