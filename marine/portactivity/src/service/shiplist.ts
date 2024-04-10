import { getDisplayableNameForEventSource, mergeTimestamps } from "../event-sourceutil.js";
import type { DbPublicShiplist } from "../dao/shiplist-public.js";
import { findByLocodePublicShiplist } from "../dao/shiplist-public.js";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import type { PublicApiTimestamp } from "../model/timestamp.js";

export type ShiplistTimestamp = PublicApiTimestamp & DbPublicShiplist;

export function dbPublicShiplistToPublicApiTimestamp(
    ts: DbPublicShiplist,
    locode: string
): ShiplistTimestamp {
    return {
        ...ts,
        source: ts.event_source,
        eventTime: ts.event_time.toISOString(),
        recordTime: ts.record_time.toISOString(),
        portcallId: ts.portcall_id,
        eventType: ts.event_type,
        ship: {
            imo: ts.ship_imo
        },
        location: {
            port: locode
        }
    };
}

export async function getShiplist(
    db: DTDatabase,
    locode: string,
    interval: number
): Promise<ShiplistTimestamp[]> {
    const dbShiplist = (await findByLocodePublicShiplist(db, locode.toUpperCase(), interval)).map((ts) =>
        dbPublicShiplistToPublicApiTimestamp(ts, locode.toUpperCase())
    );

    // don't overwrite source before merging as it utilizes source name in prioritizing
    return mergeTimestamps(dbShiplist).map(
        (ts) =>
            ({
                ...ts,
                source: getDisplayableNameForEventSource(ts.source)
            }) as ShiplistTimestamp
    );
}
