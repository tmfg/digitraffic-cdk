import * as pgPromise from "pg-promise";
import {Annotation} from "../model/annotations";
import {FeatureCollection,Feature,GeoJsonProperties,Geometry} from "geojson";
import * as wkx from "wkx";

const FIND_ALL_SQL = "select id, created_at, recorded_at, expires_at, type, location from nw2_annotation";
const FIND_ALL_ACTIVE_SQL = "select id, created_at, recorded_at, expires_at, type, location from nw2_annotation " +
    "where expires_at is null or expires_at > current_timestamp";

const UPSERT_ANNOTATIONS_SQL = "insert into nw2_annotation(id, created_at, recorded_at, expires_at, type, location)" +
    "values(${id},${created_at},${recorded_at},${expires_at},${type},${geometry}) " +
    "on conflict (id) " +
    "do update set " +
    "do update set " +
    "   expires_at = ${expires_at}," +
    "   location = ${geometry}";

export function updateAnnotations(db: pgPromise.IDatabase<any, any>, annotations: Annotation[]): Promise<void> {
    return db.tx(t => {
        annotations.map(a => {
            const geometry = createGeometry(a.location);

            console.info("annotation " + JSON.stringify(a));

            return t.none(UPSERT_ANNOTATIONS_SQL, {
                    id: a._id,
                    created_at: a.created_at,
                    recorded_at: a.recorded_at,
                    expires_at: a.expires_at,
                    type: a.tags[0].split(":", 2)[1],
                    geometry: geometry
            });
        })
    });
}

function convertToFeatureCollection(aa: any[]) {
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

export async function findAllActive(db: pgPromise.IDatabase<any, any>): Promise<FeatureCollection> {
    const features = <Feature[]> await db.manyOrNone(FIND_ALL_ACTIVE_SQL).then(convertToFeatureCollection);

    return <FeatureCollection> {
        type: "FeatureCollection",
        features: features
    }
}


export async function findAll(db: pgPromise.IDatabase<any, any>): Promise<FeatureCollection> {
    const features = <Feature[]> await db.manyOrNone(FIND_ALL_SQL).then(convertToFeatureCollection);

    return <FeatureCollection> {
        type: "FeatureCollection",
        features: features
    }
}

function createGeometry(location: any): any {
    if(location.type == 'LineString') {
        const coordinates = location.coordinates.map((c: any) =>  coordinatePair(c)).join(',');

        return `LINESTRING(${coordinates})`;
    } else if (location.type == 'Point') {
        const coordinates = coordinatePair(location.coordinates);

        return `POINT(${coordinates})`;
    }

    console.error("unsupported locationType=", location.type);

    return null;
}

function coordinatePair(coordinate: any) {
    return `${coordinate[0]} ${coordinate[1]}`;
}