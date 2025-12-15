import { default as pgPromise } from "pg-promise";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";

const PS_INSERT_RTTI = new pgPromise.PreparedStatement({
  name: "insert-rtti",
  text:
    `insert into datex2_rtti(situation_id, type, publication_time, geometry, start_time, end_time, is_srti, message)
  values ($1, $2, $3, $4, $5, $6, $7, $8)`,
});

const SQL_GET_RTTI_BY_SITUATION_ID = 
    `select distinct on (situation_id) message, is_srti from datex2_rtti 
where situation_id in ($1:csv)
order by situation_id, publication_time desc`;

export async function updateRtti(
  db: DTDatabase,
  situationId: string,
  type: string,
  publicationTime: Date,
  geometry: string,
  startTime: Date,
  endTime: Date | undefined,
  isSrti: boolean,
  message: string): Promise<void> {
  await db.none(PS_INSERT_RTTI, [situationId, type, publicationTime, geometry, startTime, endTime, isSrti,message]);
}

export interface RttiMessageDb {
  readonly message: string;
  readonly is_srti: boolean;
}

export async function getRttiBySituationId(
  db: DTDatabase,
  situationIds: string[],
): Promise<RttiMessageDb[]> {
  return await db.manyOrNone(SQL_GET_RTTI_BY_SITUATION_ID, [situationIds]);
}