import {inDatabase} from 'digitraffic-lambda-postgres/database';
import {findAllActive, findAll} from "../db/db-annotations";
import {FeatureCollection,Feature,GeoJsonProperties} from "geojson";
import * as wkx from "wkx";
import {getLastUpdated} from "../db/db-last-updated";
import * as pgPromise from "pg-promise";

export async function findAllAnnotations(): Promise<FeatureCollection> {
    return await inDatabase(async (db: pgPromise.IDatabase<any,any>) => {
        const annotations = await findAll(db).then(convertFeatures);
        const lastUpdated = await getLastUpdated(db);

        return createFeatureCollection(annotations, lastUpdated);
    });
}

export async function findAllActiveAnnotations(): Promise<FeatureCollection> {
    return await inDatabase(async (db: pgPromise.IDatabase<any,any>) => {
        const annotations = await findAllActive(db).then(convertFeatures);
        const lastUpdated = await getLastUpdated(db);

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
