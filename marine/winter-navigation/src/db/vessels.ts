import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import type { Vessel } from "../model/apidata.js";
import { default as pgPromise } from "pg-promise";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

const SQL_UPDATE_VESSELS = `
insert into wn_vessel(id, name, callsign, shortcode, imo, mmsi, type, deleted)
values ($1, $2, $3, $4, $5, $6, $7, false)
on conflict(id)
do update set
    name = $2,
    callsign = $3,
    shortcode = $4,
    imo = $5,
    mmsi = $6,
    type = $7,
    deleted = false
`;

const SQL_GET_VESSEL = `
WITH target_vessel AS (
  SELECT id FROM wn_vessel WHERE imo = $3 OR mmsi = $3
),
all_queue_relations AS (
    -- Get queues where the target vessel is the one being assisted
    SELECT
        q.id AS queue_id,
        q.vessel_id AS related_vessel_id
    FROM wn_queue q
    WHERE q.deleted = false AND q.vessel_id = (SELECT id FROM target_vessel) AND
          (CASE
            WHEN $1::timestamp IS NULL AND $2::timestamp IS NULL THEN
            -- no time constraints by default for single vessel query, return all available history
              TRUE
            ELSE
              q.start_time > COALESCE($1::timestamp, '-infinity') AND q.end_time <= COALESCE($2::timestamp, 'infinity')
          END)

    UNION ALL

    -- Get queues where the target vessel is the icebreaker
    SELECT
        q.id AS queue_id,
        s.vessel_id AS related_vessel_id
    FROM wn_queue q
    JOIN wn_source s ON q.icebreaker_id = s.id
    WHERE q.deleted = false AND s.vessel_id = (SELECT id FROM target_vessel) AND
          (CASE
            WHEN $1::timestamp IS NULL AND $2::timestamp IS NULL THEN
            -- no time constraints by default for single vessel query, return all available history
              TRUE
            ELSE
              q.start_time > COALESCE($1::timestamp, '-infinity') AND q.end_time <= COALESCE($2::timestamp, 'infinity')
          END)
),
vessel_queues AS (
    SELECT
        r.related_vessel_id,
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'start_time', q.start_time,
                'end_time', q.end_time,
                'order_num', q.order_num,
                'icebreaker_id', ib_source.id,
                'icebreaker_imo', ib_vessel.imo,
                'icebreaker_mmsi', ib_vessel.mmsi,
                'icebreaker_name', ib_vessel.name,
                'vessel_id', assisted_vessel.id,
                'vessel_imo', assisted_vessel.imo,
                'vessel_mmsi', assisted_vessel.mmsi,
                'vessel_name', assisted_vessel.name
            )
        ) AS queues
    FROM all_queue_relations r
    JOIN wn_queue q ON r.queue_id = q.id
    LEFT JOIN wn_vessel assisted_vessel ON q.vessel_id = assisted_vessel.id
    LEFT JOIN wn_source ib_source ON q.icebreaker_id = ib_source.id
    LEFT JOIN wn_vessel ib_vessel ON ib_source.vessel_id = ib_vessel.id
    GROUP BY r.related_vessel_id
),
all_activity_relations AS (
    -- Get activities where the target vessel is the one being assisted
    SELECT
        a.id AS activity_id,
        a.vessel_id AS related_vessel_id
    FROM wn_activity a
    WHERE a.deleted = false AND a.vessel_id = (SELECT id FROM target_vessel) AND
          (CASE
            WHEN $1::timestamp IS NULL AND $2::timestamp IS NULL THEN
            -- no time constraints by default for single vessel query, return all available history
              TRUE
            ELSE
              a.start_time > COALESCE($1::timestamp, '-infinity') AND a.end_time <= COALESCE($2::timestamp, 'infinity')
          END)

    UNION ALL

    -- Get activities where the target vessel is the icebreaker
    SELECT
        a.id AS activity_id,
        s.vessel_id AS related_vessel_id
    FROM wn_activity a
    JOIN wn_source s ON a.icebreaker_id = s.id
    WHERE a.deleted = false AND s.vessel_id = (SELECT id FROM target_vessel) AND
          (CASE
          -- if no parameters are given, return only activities and assistances that are currently active or set in the future
            WHEN $1::timestamp IS NULL AND $2::timestamp IS NULL THEN
            -- no time constraints by default for single vessel query, return all available history
              TRUE
            ELSE
              a.start_time > COALESCE($1::timestamp, '-infinity') AND a.end_time <= COALESCE($2::timestamp, 'infinity')
          END)
),
vessel_activities AS (
    SELECT
        r.related_vessel_id,
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'icebreaker_id', ib_source.id,
                'icebreaker_imo', ib_vessel.imo,
                'icebreaker_mmsi', ib_vessel.mmsi,
                'icebreaker_name', ib_vessel.name,
                'vessel_id', assisted_vessel.id,
                'vessel_imo', assisted_vessel.imo,
                'vessel_mmsi', assisted_vessel.mmsi,
                'vessel_name', assisted_vessel.name,
                'type', a.type,
                'reason', a.reason,
                'public_comment', a.public_comment,
                'start_time', a.start_time,
                'end_time', a.end_time
            )
        ) AS activities
    FROM all_activity_relations r
    JOIN wn_activity a ON r.activity_id = a.id
    LEFT JOIN wn_vessel assisted_vessel ON a.vessel_id = assisted_vessel.id
    LEFT JOIN wn_source ib_source ON a.icebreaker_id = ib_source.id
    LEFT JOIN wn_vessel ib_vessel ON ib_source.vessel_id = ib_vessel.id
    GROUP BY r.related_vessel_id
)
SELECT
  v.id,
  v.name,
  v.callsign,
  v.shortcode,
  v.imo,
  v.mmsi,
  v.type,
  COALESCE(vq.queues, '[]'::json) AS queues,
  COALESCE(va.activities, '[]'::json) AS activities
FROM
  wn_vessel v
  LEFT JOIN vessel_queues vq ON v.id = vq.related_vessel_id
  LEFT JOIN vessel_activities va ON v.id = va.related_vessel_id
WHERE
  v.id = (SELECT id FROM target_vessel);
`;

const SQL_GET_VESSELS = `
WITH all_queue_relations AS (
    -- Get queues where vessel is the one being assisted
    SELECT
        q.id AS queue_id,
        q.vessel_id AS related_vessel_id
    FROM wn_queue q
    WHERE q.deleted = false AND q.vessel_id IS NOT NULL AND 
          (CASE
            WHEN $1::timestamp IS NULL AND $2::timestamp IS NULL THEN
          -- if no parameters are given, return only activities and assistances that are currently active or set in the future
              q.end_time > NOW()
            ELSE
              q.start_time > COALESCE($1::timestamp, '-infinity') AND q.end_time <= COALESCE($2::timestamp, 'infinity')
          END)

    UNION ALL

    -- Get queues where vessel is icebreaker and get actual vessel id of icebreaker via table wn_source
    SELECT
        q.id AS queue_id,
        s.vessel_id AS related_vessel_id
    FROM wn_queue q
    JOIN wn_source s ON q.icebreaker_id = s.id
    WHERE q.deleted = false AND s.vessel_id IS NOT NULL AND 
          (CASE
            WHEN $1::timestamp IS NULL AND $2::timestamp IS NULL THEN
          -- if no parameters are given, return only activities and assistances that are currently active or set in the future
              q.end_time > NOW()
            ELSE
              q.start_time > COALESCE($1::timestamp, '-infinity') AND q.end_time <= COALESCE($2::timestamp, 'infinity')
          END)
),
vessel_queues AS (
    SELECT
        r.related_vessel_id,
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'start_time', q.start_time,
                'end_time', q.end_time,
                'order_num', q.order_num,
                'icebreaker_id', ib_source.id,
                'icebreaker_imo', ib_vessel.imo,
                'icebreaker_mmsi', ib_vessel.mmsi,
                'icebreaker_name', ib_vessel.name,
                'vessel_id', assisted_vessel.id,
                'vessel_imo', assisted_vessel.imo,
                'vessel_mmsi', assisted_vessel.mmsi,
                'vessel_name', assisted_vessel.name
            )
        ) AS queues
    FROM all_queue_relations r
    JOIN wn_queue q ON r.queue_id = q.id
    LEFT JOIN wn_vessel assisted_vessel ON q.vessel_id = assisted_vessel.id
    LEFT JOIN wn_source ib_source ON q.icebreaker_id = ib_source.id
    LEFT JOIN wn_vessel ib_vessel ON ib_source.vessel_id = ib_vessel.id
    GROUP BY r.related_vessel_id
),
all_activity_relations AS (
    -- Get activities where a vessel is the one being assisted
    SELECT
        a.id AS activity_id,
        a.vessel_id AS related_vessel_id
    FROM wn_activity a
    WHERE a.deleted = false AND a.vessel_id IS NOT NULL AND 
          (CASE
            WHEN $1::timestamp IS NULL AND $2::timestamp IS NULL THEN
          -- if no parameters are given, return only activities and assistances that are currently active or set in the future
              a.end_time > NOW()
            ELSE
              a.start_time > COALESCE($1::timestamp, '-infinity') AND a.end_time <= COALESCE($2::timestamp, 'infinity')
          END)

    UNION ALL

    -- Get activities where a vessel is the icebreaker
    SELECT
        a.id AS activity_id,
        s.vessel_id AS related_vessel_id
    FROM wn_activity a
    JOIN wn_source s ON a.icebreaker_id = s.id
    WHERE a.deleted = false AND s.vessel_id IS NOT NULL AND 
          (CASE
            WHEN $1::timestamp IS NULL AND $2::timestamp IS NULL THEN
          -- if no parameters are given, return only activities and assistances that are currently active or set in the future
              a.end_time > NOW()
            ELSE
              a.start_time > COALESCE($1::timestamp, '-infinity') AND a.end_time <= COALESCE($2::timestamp, 'infinity')
          END)
),
vessel_activities AS (
    SELECT
        r.related_vessel_id,
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'icebreaker_id', ib_source.id,
                'icebreaker_imo', ib_vessel.imo,
                'icebreaker_mmsi', ib_vessel.mmsi,
                'icebreaker_name', ib_vessel.name,
                'vessel_id', assisted_vessel.id,
                'vessel_imo', assisted_vessel.imo,
                'vessel_mmsi', assisted_vessel.mmsi,
                'vessel_name', assisted_vessel.name,
                'type', a.type,
                'reason', a.reason,
                'public_comment', a.public_comment,
                'start_time', a.start_time,
                'end_time', a.end_time
            )
        ) AS activities
    FROM all_activity_relations r
    JOIN wn_activity a ON r.activity_id = a.id
    LEFT JOIN wn_vessel assisted_vessel ON a.vessel_id = assisted_vessel.id
    LEFT JOIN wn_source ib_source ON a.icebreaker_id = ib_source.id
    LEFT JOIN wn_vessel ib_vessel ON ib_source.vessel_id = ib_vessel.id
    GROUP BY r.related_vessel_id
)
SELECT
  v.id,
  v.name,
  v.callsign,
  v.shortcode,
  v.imo,
  v.mmsi,
  v.type,
  COALESCE(vq.queues, '[]'::json) AS queues,
  COALESCE(va.activities, '[]'::json) AS activities
FROM
  wn_vessel v
  LEFT JOIN vessel_queues vq ON v.id = vq.related_vessel_id
  LEFT JOIN vessel_activities va ON v.id = va.related_vessel_id
WHERE
  v.deleted = false;
`;

const PS_UPDATE_VESSELS = new pgPromise.PreparedStatement({
  name: "update-vessels",
  text: SQL_UPDATE_VESSELS,
});

const PS_GET_VESSEL = new pgPromise.PreparedStatement({
  name: "get-vessel",
  text: SQL_GET_VESSEL,
});

const PS_GET_VESSELS = new pgPromise.PreparedStatement({
  name: "get-vessels",
  text: SQL_GET_VESSELS,
});

export function saveAllVessels(
  db: DTDatabase,
  vessels: Vessel[],
): Promise<unknown> {
  return Promise.all(
    vessels.map(async (v) => {
      return db.any(PS_UPDATE_VESSELS, [
        v.id,
        v.name,
        v.callsign,
        v.shortcode,
        v.imo,
        v.mmsi,
        v.type,
      ]);
    }),
  );
}

export async function getVessel(
  db: DTDatabase,
  vesselId: number,
  activeFrom?: Date,
  activeTo?: Date,
): Promise<Vessel | undefined> {
  return await db.oneOrNone(PS_GET_VESSEL, [activeFrom, activeTo, vesselId]) ??
    undefined;
}

export async function getVessels(
  db: DTDatabase,
  activeFrom?: Date,
  activeTo?: Date,
): Promise<Vessel[]> {
  logger.info({
    method: "GetVessels.getVessels",
    message: `from: ${JSON.stringify(activeFrom)} to: ${
      JSON.stringify(activeTo)
    }`,
  });

  return db.manyOrNone(PS_GET_VESSELS, [activeFrom, activeTo]);
}
