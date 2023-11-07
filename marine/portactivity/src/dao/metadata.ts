import { PreparedStatement } from "pg-promise";
import { DTDatabase } from "@digitraffic/common/dist/database/database";

const FIND_DISTINCT_LOCODES_BY_TIMESTAMP_SOURCE = new PreparedStatement({
    name: "find-distinct-locodes-by-timestamp-source",
    text: `
        SELECT DISTINCT location_locode
        FROM port_call_timestamp
        WHERE event_source = ANY ($1);
    `,
    rowMode: "array"
});

export function findLocodesBySource(db: DTDatabase, sources: string[][]): Promise<string[]> {
    return db.tx((t) => t.manyOrNone(FIND_DISTINCT_LOCODES_BY_TIMESTAMP_SOURCE, sources));
}
