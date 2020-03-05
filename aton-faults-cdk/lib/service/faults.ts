import * as LastUpdatedDB from "../../../common/db/last-updated";
import * as FaultsDB from "../db/db-faults"
import {inDatabase} from "../../../common/postgres/database";
import {IDatabase} from "pg-promise";
import {FeatureCollection,Feature,GeoJsonProperties} from "geojson";
import {Geometry} from "wkx";
import {createFeatureCollection} from "../../../common/api/geojson";
import {Builder} from 'xml2js';

let moment = require('moment');

const ATON_DATA_TYPE = "ATON_FAULTS";
const YEAR_MONTH_DAY = "YYYY-MM-DD";
const HOUR_MINUTE_SECOND = "HH:MM:SSZ";

const PRODUCTION_AGENCY = {
    'language' : 'fin',
    'text' : 'Finnish Transport Infrastructure Agency'
};

const NAME_OF_SERIES = 'Finnish ATON Faults';

export async function findAllFaults(): Promise<FeatureCollection> {
    return await inDatabase(async (db: IDatabase<any,any>) => {
        const features = await FaultsDB.streamAllForJson(db, convertFeature);
        const lastUpdated = await LastUpdatedDB.getUpdatedTimestamp(db, ATON_DATA_TYPE);

        return createFeatureCollection(features, lastUpdated);
    });
}

export async function findAllFaultsS124(): Promise<any> {
    const start = Date.now();

    const faults = await inDatabase(async (db: IDatabase<any,any>) => {
        return await FaultsDB.streamAllForS124(db, createXml);
    });

    try {
        return {
            body: new Builder().buildObject({
                'DataSets': faults
            })
        }
    } finally {
        console.info("buildObject took %d", Date.now() - start);
    }
}

function createXml(fault: any) {
    const faultId = -fault.id;
    const year = fault.entry_timestamp.getFullYear() - 2000;

    const id = `FI.${faultId}.${year}`;
    const urn = `urn:mrn:s124:NW.${id}.P`;

    return {
        'S124:DataSet': {
            '$': {
                'xmlns:S124' : "http://www.iho.int/S124/gml/1.0",
                'xsi:schemaLocation' : 'http://www.iho.int/S124/gml/1.0 ../../schemas/0.5/S124.xsd',
                'xmlns:xsi' : "http://www.w3.org/2001/XMLSchema-instance",
                'xmlns:GML' : "http://www.opengis.net/gml/3.2",
                'xmlns:S100' : "http://www.iho.int/s100gml/1.0",
                'xmlns:xlink' : "http://www.w3.org/1999/xlink",
                'GML:id' : id
            },
            'imember': {
                'S124:S124_Preamble': {
                    '$': {
                        'GML:id' : `PR.${id}`
                    },
                    'id' : urn,
                    'messageSeriesIdentifier' : createMessageSeriesIdentifier(faultId, year),
                    'sourceDate': fault.entry_timestamp.toISOString(),
                    'generalArea': fault.area_description_fi,
                    'locality' : {
                        'text': fault.fairway_name_fi
                    },
                    'title':  {
                        'text' : `${fault.aton_id} ${fault.aton_type_fi} ${fault.aton_name_fi}, ${fault.type}`
                    },
                    'fixedDateRange' : createFixedDateRange(fault)
                }
            },
            'member': {
                'S124:S124_NavigationalWarningPart': {
                    '$': {
                        'GML:id' : `NW.${id}.1`
                    },
                    'id': `${urn}.1`,
                    'geometry' : createGeometryElement(fault, id)
                }
            }
        }
    };
}

function createFixedDateRange(fault: any) {
    if(fault.fixed_timestamp) {
        return {
            'timeOfDayStart' : moment(fault.entry_timestamp).format(HOUR_MINUTE_SECOND),
            'dateStart' : moment(fault.entry_timestamp).format(YEAR_MONTH_DAY) ,
            'timeOfDayEnd' : moment(fault.fixed_timestamp).format(HOUR_MINUTE_SECOND),
            'dateEnd' : moment(fault.fixed_timestamp).format(YEAR_MONTH_DAY)
        }
    }

    return {
        'timeOfDayStart' : moment(fault.entry_timestamp).format(HOUR_MINUTE_SECOND),
        'dateStart' : moment(fault.entry_timestamp).format(YEAR_MONTH_DAY) ,
    }
}

function createGeometryElement(fault: any, id: string) {
    return {
        'S100:pointProperty' : {
            '$' : {
                'GML:id' : `s.NW.${id}.1`,
                'srcName' : 'EPSG:4326'
            },
            'GML:pos' : createCoordinatePair(fault.geometry)
        }
    }
}

function createCoordinatePair(geometry: any) {
    const g = Geometry.parse(Buffer.from(geometry, "hex")).toGeoJSON() as any;

    return`${g.coordinates[0]} ${g.coordinates[1]}`;
}

function createMessageSeriesIdentifier(faultId: any, year: number) {
    return {
        'nameOfSeries' : NAME_OF_SERIES,
        'typeOfWarning' : 'local',
        'warningNumber' : faultId,
        'year' : year,
        'productionAgency' : PRODUCTION_AGENCY,
        'country' : 'fi'
    };
}

function convertFeature(fault: any) {
    const properties = <GeoJsonProperties>{
        id: fault.id,
        entry_timestamp: fault.entry_timestamp,
        fixed_timestamp: fault.fixed_timestamp,
        type: fault.type,
        domain: fault.domain,
        state: fault.state,
        fixed: fault.fixed,
        aton_id: fault.aton_id,
        aton_name_fi: fault.aton_name_fi,
        aton_name_se: fault.aton_name_se,
        aton_type_fi: fault.aton_type_fi,
        aton_type_se: fault.aton_type_se,
        fairway_number: fault.fairway_number,
        fairway_name_fi: fault.fairway_name_fi,
        fairway_name_se: fault.fairway_name_se,
        area_number: fault.area_number,
        area_description_fi: fault.area_description_fi,
        area_description_se: fault.area_description_se
    };

    // convert geometry from db to geojson
    const geometry = Geometry.parse(Buffer.from(fault.geometry, "hex")).toGeoJSON();

    return <Feature>{
        type: "Feature",
        properties: properties,
        geometry: geometry
    };
}

export async function saveFaults(domain: string, newFaults: any[]) {
    const start = Date.now();

    await inDatabase(async (db: IDatabase<any,any>) => {
        return await db.tx(t => {
            return t.batch(
                FaultsDB.updateFaults(db, domain, newFaults),

                LastUpdatedDB.updateUpdatedTimestamp(db, ATON_DATA_TYPE, new Date(start))
            );
        });
    }).then(a => {
        const end = Date.now();
        console.info("method=saveAnnotations updatedCount=%d tookMs=%d", a.length, (end-start));
    })

}