import {initDbConnection} from 'digitraffic-lambda-postgres/database';
import {findAllActive, findAll} from "../db/db-annotations";
import {FeatureCollection,Feature,GeoJsonProperties} from "geojson";
import * as wkx from "wkx";
import {getLastUpdated} from "../db/db-last-updated";

export async function findAllAnnotations(): Promise<FeatureCollection> {
    const db = initDbConnection(
        process.env.DB_USER as string,
        process.env.DB_PASS as string,
        process.env.DB_URI as string
    );

    try {
        const annotations = await findAll(db).then(convertFeatures)
        const lastUpdated = await getLastUpdated(db);

        return await createFeatureCollection(annotations, lastUpdated);
    } finally {
        db.$pool.end();
    }
}

export async function findAllActiveAnnotations(): Promise<FeatureCollection> {
    const db = initDbConnection(
        process.env.DB_USER as string,
        process.env.DB_PASS as string,
        process.env.DB_URI as string
    );

    try {
        const annotations = await findAllActive(db).then(convertFeatures);
        const lastUpdated = await getLastUpdated(db);

        return await createFeatureCollection(annotations, lastUpdated);
    } finally {
        db.$pool.end();
    }
}

async function createFeatureCollection(features: Feature[], lastUpdated: Date | null) {
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

        const geometry = wkx.Geometry.parse(new Buffer(a.location, "hex")).toGeoJSON();

        return <Feature>{
            id: a.id,
            properties: properties,
            geometry: geometry
        };
    })
}
