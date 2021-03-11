import {inDatabase} from "../../../../common/postgres/database";
import {IDatabase} from "pg-promise";
import {RtzVoyagePlan} from "../model/voyageplan";
import {findFaultIdsByRoute} from "../db/db-voyageplan-faults";
import {LineString, Point} from "wkx";

export async function findFaultIdsForVoyagePlan(voyagePlan: RtzVoyagePlan): Promise<number[]> {
    return await inDatabase(async (db: IDatabase<any,any>) => {
        const voyageLineString =
            new LineString(voyagePlan.route.waypoints
                .flatMap(w => w.waypoint.flatMap(x => x.position))
                .map(p => new Point(p.$.lat, p.$.lon)));
        return findFaultIdsByRoute(db, voyageLineString);
    });
}
