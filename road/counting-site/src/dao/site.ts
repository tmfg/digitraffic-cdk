import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import type { FeatureCollection } from "geojson";
import { sql } from "kysely";
import { default as pgPromise } from "pg-promise";
import type { ApiSite } from "../model/v2/api-model.js";
import type { DbSite } from "../model/v2/db-model.js";
import type { Domain } from "../model/v2/types.js";
import { database } from "./db.js";

const SQL_GET_SITES_AS_FEATURE_COLLECTION = `select json_build_object(
                    'type', 'FeatureCollection',
                    'dataUpdatedTime', to_char(coalesce(max(modified), to_timestamp(0)) at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
                    'features', coalesce(json_agg(
                            json_build_object(
                                    'type', 'Feature',
                                    'geometry', ST_AsGeoJSON(ST_POINT(longitude, latitude))::json,
                                    'properties', json_build_object(
                                            'id', id,
                                            'name', name,
                                            'domain', domain,
                                            'description', description,
                                            'customId', custom_id,
                                            'granularity', granularity,
                                            'directional', directional,
                                            'travelModes', travel_modes,
                                            'lastDataTimestamp', to_char(last_data_timestamp at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
                                            'removedTimestamp', to_char(removed_timestamp at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
                                            'dataUpdatedTime', to_char(modified at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
                                        )
                                )
                        ), '[]')
                    ) as collection
from cs2_site
where (id = $1 or $1 is null)
and (domain = $2 or $2 is null)`;

const PS_GET_SITES_AS_FEATURE_COLLECTION = new pgPromise.PreparedStatement({
  name: "get-sites-as-feature-collection",
  text: SQL_GET_SITES_AS_FEATURE_COLLECTION,
});

interface DbCollection {
  collection: FeatureCollection;
}

export function getSitesAsFeatureCollection(
  db: DTDatabase,
  siteId?: number,
  domain?: string,
): Promise<FeatureCollection> {
  return db
    .one<DbCollection>(PS_GET_SITES_AS_FEATURE_COLLECTION, [siteId, domain])
    .then((r) => r.collection);
}

export function getAllSites(
  db: DTDatabase,
  domain?: Domain,
): Promise<DbSite[]> {
  let creator = database
    .selectFrom("cs2_site")
    .select([
      "id",
      "name",
      "description",
      "domain",
      "custom_id",
      "latitude",
      "longitude",
      "granularity",
      "directional",
      "travel_modes",
      "removed_timestamp",
      "last_data_timestamp",
    ])
    .orderBy("id");

  if (domain) creator = creator.where("domain", "=", domain);

  const compiled = creator.compile();

  return db.manyOrNone(compiled.sql, compiled.parameters);
}

export async function addSites(
  db: DTDatabase,
  domain: Domain,
  sites: ApiSite[],
): Promise<void> {
  await Promise.all(
    sites.map((s) => {
      const compiled = database
        .insertInto("cs2_site")
        .values({
          id: s.id,
          name: s.name,
          description: s.description,
          domain,
          custom_id: s.customId,
          latitude: s.location.lat,
          longitude: s.location.lon,
          granularity: s.granularity,
          directional: s.directional,
          travel_modes: s.travelModes,
        })
        .compile();

      return db.none(compiled.sql, compiled.parameters);
    }),
  );
}

export async function removeSites(
  db: DTDatabase,
  sites: DbSite[],
): Promise<void> {
  await Promise.all(
    sites.map((s) => {
      const compiled = database
        .updateTable("cs2_site")
        .set("removed_timestamp", sql`current_timestamp`)
        .where("id", "=", s.id)
        .compile();

      return db.none(compiled.sql, compiled.parameters);
    }),
  );
}

export async function updateSites(
  db: DTDatabase,
  sites: ApiSite[],
): Promise<void> {
  await Promise.all(
    sites.map((s) => {
      const compiled = database
        .updateTable("cs2_site")
        .set("name", s.name)
        .set("description", s.description)
        .set("custom_id", s.customId)
        .set("latitude", s.location.lat)
        .set("longitude", s.location.lon)
        .set("granularity", s.granularity ?? null)
        .set("directional", s.directional)
        .set("travel_modes", s.travelModes)
        .set("removed_timestamp", sql`null`)
        .where("id", "=", s.id)
        .compile();

      return db.none(compiled.sql, compiled.parameters);
    }),
  );
}

export async function updateSiteTimestamp(
  db: DTDatabase,
  siteId: number,
  timestamp: Date,
): Promise<void> {
  const compiled = database
    .updateTable("cs2_site")
    .set("last_data_timestamp", timestamp)
    .where("id", "=", siteId)
    .compile();

  await db.none(compiled.sql, compiled.parameters);
}
