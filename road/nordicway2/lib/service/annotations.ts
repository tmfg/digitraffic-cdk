import {inDatabase} from '../../../../common/postgres/database';
import {createFeatureCollection} from "../../../../common/api/geojson";
import * as LastUpdatedDB from "../../../../common/db/last-updated";

import * as AnnotationsDB from "../db/annotations";
import {Annotation} from "../model/annotations";

import {FeatureCollection,Feature,GeoJsonProperties} from "geojson";
import {Geometry} from "wkx";
import {IDatabase} from "pg-promise";

export async function findAllAnnotations(): Promise<FeatureCollection> {
    return await inDatabase(async (db: IDatabase<any,any>) => {
        const annotations = await AnnotationsDB.findAll(db).then(convertFeatures);
        const lastUpdated = await LastUpdatedDB.getLastUpdated(db, LastUpdatedDB.DataType.NW2_ANNOTATIONS);

        return createFeatureCollection(annotations, lastUpdated);
    });
}

export async function findActiveAnnotations(author: string|null, type: string|null): Promise<FeatureCollection> {
    return await inDatabase(async (db: IDatabase<any,any>) => {
        const annotations = await AnnotationsDB.findActive(db, author, type).then(convertFeatures);
        const lastUpdated = await LastUpdatedDB.getLastUpdated(db, LastUpdatedDB.DataType.NW2_ANNOTATIONS);

        return createFeatureCollection(annotations, lastUpdated);
    });
}

function convertFeatures(aa: any[]) {
    return aa.map(a => {
        const properties = <GeoJsonProperties>{
            id: a.id,
            author: a.author,
            createdAt: a.created_at,
            updatedAt: a.updated_at,
            recordedAt: a.recorded_at,
            expiresAt: a.expires_at,
            type: a.type
        };

        // convert geometry from db to geojson
        const geometry = Geometry.parse(Buffer.from(a.location, "hex")).toGeoJSON();

        return <Feature>{
            type: "Feature",
            properties: properties,
            geometry: geometry
        };
    })
}

function validate(annotation: Annotation) {
    return annotation.tags != null && annotation.tags.length > 0 && annotation.location != null;
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

    await inDatabase(async (db: IDatabase<any,any>) => {
        return await db.tx((t: any) => {
            const promises = [
                ...AnnotationsDB.updateAnnotations(db, validated),
                LastUpdatedDB.updateLastUpdated(db, LastUpdatedDB.DataType.NW2_ANNOTATIONS, timeStampTo)
            ];

            return t.batch(promises);
        })
    }).then(a => {
        const end = Date.now();
        console.info("method=saveAnnotations updatedCount=%d tookMs=%d", a.length - 1, (end-start));
    })
}

