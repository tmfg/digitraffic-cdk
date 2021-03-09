import {inDatabase} from "../../../../common/postgres/database";
import {IDatabase} from "pg-promise";
import {RtzVoyagePlan} from "../model/voyageplan";

export async function findFaultsForVoyagePlan(voyagePlan: RtzVoyagePlan): Promise<any> {
    return await inDatabase(async (db: IDatabase<any,any>) => {
        const voyagePoints = voyagePlan.route.waypoints
            .flatMap(w => w.waypoint.flatMap(x => x.position))
            .map(p => ({lat: p.$.lat, lon: p.$.lon}));

        return Promise.resolve();
    });
}
