import { getDisplayableNameForEventSource, mergeTimestamps } from "../event-sourceutil";
import { DbPublicShiplist, findByLocodePublicShiplist } from "../dao/shiplist-public";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";

export function dbPublicShiplistToPublicApiTimestamp(ts: DbPublicShiplist, locode: string) {
    return Object.assign(ts, {
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
    });
}

export async function getShiplist(db: DTDatabase, locode: string, interval: number) {
    const dbShiplist = (await findByLocodePublicShiplist(db, locode.toUpperCase(), interval)).map((ts) =>
        dbPublicShiplistToPublicApiTimestamp(ts, locode.toUpperCase())
    );
    // don't overwrite source before merging as it utilizes source name in prioritizing
    return mergeTimestamps(dbShiplist).map((ts) =>
        Object.assign(ts, {
            source: getDisplayableNameForEventSource(ts.source)
        })
    );
}
