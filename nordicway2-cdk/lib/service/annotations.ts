import {inDatabase} from 'digitraffic-lambda-postgres/database';
import * as AnnotationsDB from "../db/db-annotations";
import {FeatureCollection,Feature,GeoJsonProperties} from "geojson";
import * as wkx from "wkx";
import * as LastUpdatedDB from "../db/db-last-updated";
import * as pgPromise from "pg-promise";
import {Annotation} from "../model/annotations";

export async function findAllAnnotations(): Promise<FeatureCollection> {
    return await inDatabase(async (db: pgPromise.IDatabase<any,any>) => {
        const annotations = await AnnotationsDB.findAll(db).then(convertFeatures);
        const lastUpdated = await LastUpdatedDB.getLastUpdated(db);

        return createFeatureCollection(annotations, lastUpdated);
    });
}

export async function findAllActiveAnnotations(): Promise<FeatureCollection> {
    return await inDatabase(async (db: pgPromise.IDatabase<any,any>) => {
        const annotations = await AnnotationsDB.findAllActive(db).then(convertFeatures);
        const lastUpdated = await LastUpdatedDB.getLastUpdated(db);

        return createFeatureCollection(annotations, lastUpdated);
    });
}

function createFeatureCollection(features: Feature[], lastUpdated: Date | null) {
    return <FeatureCollection> {
        type: "FeatureCollection",
        lastUpdated: lastUpdated,
        features: features
    }
}

function convertFeatures(aa: any[]) {
    return aa.map(a => {
        const properties = <GeoJsonProperties>{
            createdAt: a.created_at,
            recordedAt: a.recorded_at,
            expiresAt: a.expires_at,
            type: a.type
        };

        // convert geometry from db to geojson
        const geometry = wkx.Geometry.parse(new Buffer(a.location, "hex")).toGeoJSON();

        return <Feature>{
            id: a.id,
            properties: properties,
            geometry: geometry
        };
    })
}

export async function saveAnnotations(annotations: Annotation[], timeStampTo: Date) {
    console.info("updateCount=" + annotations.length);
    const start = Date.now();

    await inDatabase(async (db: pgPromise.IDatabase<any,any>) => {
        console.info("inDatabase saveAnnotations");

        await db.tx(t => {
            console.info("inDatabase inside transaction saveAnnotations");
            return t.batch(
                AnnotationsDB.updateAnnotations(db, annotations),
                LastUpdatedDB.updateLastUpdated(db, timeStampTo)
            );
        });
    });

    const end = Date.now();
    console.info("method=saveAnnotations tookMs=" + (end-start));
}

