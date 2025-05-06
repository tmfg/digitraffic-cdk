import type { Connection } from "mysql2/promise.js";
import { inDatabase } from "../util/database.js";

const FIND_ROWS = `
select attap_id, station_short_code, scheduled_time, type
from time_table_row ttr
where departure_date = :departureDate and train_number = :trainNumber
order by scheduled_time, type`;

export interface TimeTableRow {
  readonly attap_id: number;
  readonly station_short_code: string;
  readonly scheduled_time: string;
  readonly type: number;
}

/**
 * Find all time table rows for given train
 */
export async function findTimeTableRows(
  trainNumber: number,
  departureDate: string,
): Promise<TimeTableRow[]> {
  const [rows] = await inDatabase(async (conn: Connection) => {
    return await conn.query(FIND_ROWS, {
      trainNumber,
      departureDate,
    });
  });
  return rows as TimeTableRow[];
}
