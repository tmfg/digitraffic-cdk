import * as LastUpdatedDB from "../../../common/db/last-updated";
import * as FaultsDb from "../db/db-faults"
import {inDatabase} from "../../../common/postgres/database";
import {IDatabase} from "pg-promise";
import {FeatureCollection,Feature,GeoJsonProperties} from "geojson";
import {Geometry} from "wkx";
import {createFeatureCollection} from "../../../common/api/geojson";

const ATON_DATA_TYPE = "ATON_FAULTS";

export async function findAllFaults(): Promise<FeatureCollection> {
    return await inDatabase(async (db: IDatabase<any,any>) => {
        const annotations = await FaultsDb.findAll(db).then(convertFeatures);
        const lastUpdated = await LastUpdatedDB.getUpdatedTimestamp(db, ATON_DATA_TYPE);

        return createFeatureCollection(annotations, lastUpdated);
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
            state: a.state,
            fixed: a.fixed,
            aton_id: a.aton_id,
            aton_name_fi: a.aton_name_fi,
            aton_name_se: a.aton_name_se,
            aton_type_fi: a.aton_type_fi,
            aton_type_se: a.aton_type_se,
            fairway_number: a.fairway_number,
            fairway_name_fi: a.fairway_name_fi,
            fairway_name_se: a.fairway_name_se,
            area_number: a.area_number,
            area_description_fi: a.area_description_fi,
            area_description_se: a.area_description_se
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
                FaultsDb.updateFaults(db, domain, newFaults),
                LastUpdatedDB.updateUpdatedTimestamp(db, ATON_DATA_TYPE, new Date(start))
            );
        });
    }).then(a => {
        const end = Date.now();
        console.info("method=saveAnnotations updatedCount=%d tookMs=%d", a.length, (end-start));
    })

}