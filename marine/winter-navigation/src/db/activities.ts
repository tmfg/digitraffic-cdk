import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import type { Activity } from "../model/apidata.js";
import { default as pgPromise } from "pg-promise";

const SQL_UPDATE_ACTIVITIES = `
insert into wn_activity(id, icebreaker_id, vessel_id, type, reason, public_comment, start_time, end_time, deleted)
values ($1, $2, $3, $4, $5, $6, $7, $8, false)
on conflict(id)
do update set
    icebreaker_id = $2,
    vessel_id = $3,
    type = $4,
    reason = $5,
    public_comment = $6,
    start_time = $7,
    end_time = $8,
    deleted = false
`;

const SQL_GET_ACTIVITIES = `select icebreaker_id, vessel_id, type, reason, public_comment, start_time, end_time
from wn_activity
where deleted = false`;

const PS_UPDATE_ACTIVITIES = new pgPromise.PreparedStatement({
    name: "update-activities",
    text: SQL_UPDATE_ACTIVITIES
});

const PS_GET_ACTIVITIES = new pgPromise.PreparedStatement({
    name: "get-activities",
    text: SQL_GET_ACTIVITIES
});

export function saveAllActivities(db: DTDatabase, activities: Activity[]): Promise<unknown> {
    return Promise.all(
        activities.map(async (a) => {
            return db.any(PS_UPDATE_ACTIVITIES, [
                a.id,
                a.icebreaker_id,
                a.vessel_id,
                a.type,
                a.reason,
                a.public_comment,
                a.start_time,
                a.end_time
            ]);
        })
    );
}

export async function getActivities(db: DTDatabase): Promise<Activity[]> {
    return db.manyOrNone(PS_GET_ACTIVITIES);
}

