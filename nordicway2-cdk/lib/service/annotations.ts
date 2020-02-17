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
            id: a.id,
            author: a.author,
            createdAt: a.created_at,
            recordedAt: a.recorded_at,
            expiresAt: a.expires_at,
            type: a.type
        };

        // convert geometry from db to geojson
        const geometry = wkx.Geometry.parse(Buffer.from(a.location, "hex")).toGeoJSON();

        return <Feature>{
            type: "Feature",
            properties: properties,
            geometry: geometry
        };
    })
}

function validate(annotation: Annotation) {
    return annotation.tags != null && annotation.tags.length > 0 && annotation.tags[0].indexOf(":") != -1 && annotation.location != null;
}

export async function saveAnnotations(annotations: Annotation[], timeStampTo: Date) {
    const start = Date.now();
    let validated: any[] = [];

    annotations.forEach(a => {
        if(validate(a)) {
            validated.push(a);
        } else {
            console.error("invalid annotation json=%s", JSON.stringify(a));
        }
    })

    await inDatabase(async (db: pgPromise.IDatabase<any,any>) => {
        return await db.tx(t => {
            return t.batch(
                AnnotationsDB.updateAnnotations(db, validated),
                LastUpdatedDB.updateLastUpdated(db, timeStampTo)
            );
        });
    }).then(a => {
        const end = Date.now();
        console.info("method=saveAnnotations updatedCount=%d tookMs=%d", a.length, (end-start));
    })
}

