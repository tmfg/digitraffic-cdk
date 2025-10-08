import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import type { Queue, QueueDB } from "../model/apidata.js";
import { default as pgPromise } from "pg-promise";

const SQL_UPDATE_QUEUES = `
insert into wn_queue(id, icebreaker_id, vessel_id, start_time, end_time, order_num, deleted)
values ($1, $2, $3, $4, $5, $6, false)
on conflict(id)
do update set
    icebreaker_id = $2,
    vessel_id = $3,
    start_time = $4,
    end_time = $5,
    order_num = $6,
    deleted = false
`;

const SQL_GET_QUEUES = `
  select id, icebreaker_id, vessel_id, start_time, end_time, order_num
  from wn_queue where deleted = false
`;

const PS_UPDATE_QUEUES = new pgPromise.PreparedStatement({
  name: "update-queues",
  text: SQL_UPDATE_QUEUES,
});

export function saveAllQueues(
  db: DTDatabase,
  queues: QueueDB[],
): Promise<unknown> {
  return Promise.all(
    queues.map(async (q) => {
      return db.any(PS_UPDATE_QUEUES, [
        q.id,
        q.icebreaker_id,
        q.vessel_id,
        q.start_time,
        q.end_time,
        q.order_num,
      ]);
    }),
  );
}

export async function getQueues(db: DTDatabase): Promise<QueueDB[]> {
  return db.any(SQL_GET_QUEUES);
}
