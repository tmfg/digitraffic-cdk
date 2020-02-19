import * as FaultsDb from "../db/db-faults"
import {inDatabase} from "../../../common/postgres/database";
import {IDatabase} from "pg-promise";
import {FeatureCollection,Feature,GeoJsonProperties} from "geojson";
import {Geometry} from "wkx";
import {createFeatureCollection} from "../../../common/api/geojson"

export async function findAllFaults(): Promise<FeatureCollection> {
    return await inDatabase(async (db: IDatabase<any,any>) => {
        const annotations = await FaultsDb.findAll(db).then(convertFeatures);
        //const lastUpdated = await LastUpdatedDB.getLastUpdated(db);

        return createFeatureCollection(annotations, null);
    });
}

function convertFeatures(fa: any[]) {
    return fa.map(a => {
        const properties = <GeoJsonProperties>{
            id: a.id,
            entry_timestamp: a.entry_timestamp,
            fixed_timestamp: a.fixed_timestamp,
            type: a.type,
            domain: a.domain,
            fixed: a.fixed
        };

        // convert geometry from db to geojson
        const geometry = Geometry.parse(Buffer.from(a.geometry, "hex")).toGeoJSON();

        return <Feature>{
            type: "Feature",
            properties: properties,
            geometry: geometry
        };
    })
}

export async function saveFaults(domain: string, newFaults: any[]) {
    const start = Date.now();

    await inDatabase(async (db: IDatabase<any,any>) => {
        return await db.tx(t => {
            return t.batch(
                FaultsDb.updateFaults(db, domain, newFaults)
            );
        });
    }).then(a => {
        const end = Date.now();
        console.info("method=saveAnnotations updatedCount=%d tookMs=%d", a.length, (end-start));
    })

}