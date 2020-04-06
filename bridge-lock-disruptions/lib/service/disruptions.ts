import * as LastUpdatedDB from "../../../common/db/last-updated";
import * as DisruptionsDB from "../db/db-disruptions"
import {inDatabase} from "../../../common/postgres/database";
import {IDatabase} from "pg-promise";
import {FeatureCollection,Feature,Geometry as GeoJSONGeometry} from "geojson";
import {Geometry} from "wkx";
import {createFeatureCollection} from "../../../common/api/geojson";
import {DbDisruption} from "../db/db-disruptions";
import {Disruption} from "../model/disruption";

const BRIDGE_LOCK_DISRUPTIONS_DATA_TYPE = "BRIDGE_LOCK_DISRUPTIONS";

export async function findAllDisruptions(): Promise<FeatureCollection> {
    return await inDatabase(async (db: IDatabase<any,any>) => {
        const features = await DisruptionsDB.findAll(db, convertFeature);
        //const lastUpdated = await LastUpdatedDB.getUpdatedTimestamp(db, BRIDGE_LOCK_DISRUPTIONS_DATA_TYPE);
        return createFeatureCollection(features, null);
    });
}

export async function saveDisruptions(newDisruptions: Feature[]) {
    const start = Date.now();
    await inDatabase(async (db: IDatabase<any,any>) => {
        return await db.tx(t => {
            return t.batch(
                DisruptionsDB.updateDisruptions(db, newDisruptions),
                //LastUpdatedDB.updateUpdatedTimestamp(db, BRIDGE_LOCK_DISRUPTIONS_DATA_TYPE, new Date(start))
            );
        });
    }).then(a => {
        const end = Date.now();
        console.info("method=saveDisruptions updatedCount=%d tookMs=%d", a.length, (end-start));
    });
}


function convertFeature(disruption: DbDisruption): Feature {
    const properties: Disruption = {
        Id: disruption.bridgelock_id,
        Type_Id: disruption.bridgelock_type_id,
        StartDate: disruption.start_date,
        EndDate: disruption.end_date,
        DescriptionFi: disruption.description_fi,
        DescriptionSv: disruption.description_sv,
        DescriptionEn: disruption.description_en,
        AdditionalInformationFi: disruption.additional_info_fi,
        AdditionalInformationSv: disruption.additional_info_sv,
        AdditionalInformationEn: disruption.additional_info_en
    };
    // convert geometry from db to geojson
    const geometry = Geometry.parse(Buffer.from(disruption.geometry, "hex")).toGeoJSON() as GeoJSONGeometry;
    return {
        type: "Feature",
        properties,
        geometry
    };
}
