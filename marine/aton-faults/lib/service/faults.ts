import * as LastUpdatedDB from "../../../../common/db/last-updated";
import * as FaultsDB from "../db/db-faults"
import {inDatabase} from "../../../../common/postgres/database";
import {IDatabase} from "pg-promise";
import {Geometry, LineString, Point} from "wkx";
import {Builder} from 'xml2js';
import {RtzVoyagePlan} from "../../../../common/vis/voyageplan";
import {findFaultIdsByRoute} from "../db/db-faults";
import moment from 'moment-timezone';
import {Feature, GeoJsonProperties} from "geojson";
import {createFeatureCollection} from "../../../../common/api/geojson";
import {Language} from "../../../../common/model/language";

const ATON_DATA_TYPE = "ATON_FAULTS";
const YEAR_MONTH_DAY = "YYYY-MM-DD";
const HOUR_MINUTE_SECOND = "HH:MM:SSZ";

const PRODUCTION_AGENCY = {
    'language' : 'fin',
    'text' : 'Finnish Transport Infrastructure Agency'
};

const NAME_OF_SERIES = 'Finnish ATON Faults';

export async function findAllFaults(language: Language, fixedInHours: number): Promise<any> {
    return await inDatabase(async (db: IDatabase<any,any>) => {
        const features = await FaultsDB.streamAllForJson(db, language, fixedInHours, convertFeature);
        const lastUpdated = await LastUpdatedDB.getUpdatedTimestamp(db, ATON_DATA_TYPE);

        return createFeatureCollection(features, lastUpdated);
    });
}

export async function getFaultS124ById(faultId: number): Promise<string> {
    const start = Date.now();

    const fault = await inDatabase(async (db: IDatabase<any,any>) => {
        return await FaultsDB.getFaultById(db, faultId);
    });

    try {
        return new Builder().buildObject(createXml(fault));
    } finally {
        console.info("method=getFaultS124ById tookMs=%d", Date.now() - start);
    }
}

export async function findFaultIdsForVoyagePlan(voyagePlan: RtzVoyagePlan): Promise<number[]> {
    const start = Date.now();
    const voyageLineString =
        new LineString(voyagePlan.route.waypoints
            .flatMap(w => w.waypoint.flatMap( wp => wp.position))
            .map(p => new Point(p.$.lon, p.$.lat)));
    const faultIds = await inDatabase(async (db: IDatabase<any,any>) => {
        return findFaultIdsByRoute(db, voyageLineString);
    });
    console.info("method=findFaultIdsForVoyagePlan tookMs=%d count=%d", Date.now() - start, faultIds.length);
    return faultIds;
}

export async function saveFaults(domain: string, newFaults: any[]) {
    const start = Date.now();
    const validated = newFaults.filter(validate);

    await inDatabase(async (db: IDatabase<any,any>) => {
        return await db.tx(t => {
            return t.batch([
                ...FaultsDB.updateFaults(db, domain, validated),
                LastUpdatedDB.updateUpdatedTimestamp(db, ATON_DATA_TYPE, new Date(start))
            ]);
        });
    }).then(a => {
        const end = Date.now();
        console.info("method=saveFaults receivedCount=%d updatedCount=%d tookMs=%d", newFaults.length, a.length - 1, (end - start));
    })
}

function convertFeature(fault: any) {
    const properties = <GeoJsonProperties>{
        id: fault.id,
        entry_timestamp: fault.entry_timestamp,
        fixed_timestamp: fault.fixed_timestamp,
        type: fault.aton_fault_type,
        domain: fault.domain,
        state: fault.state,
        fixed: fault.fixed,
        aton_id: fault.aton_id,
        aton_name_fi: fault.aton_name_fi,
        aton_name_se: fault.aton_name_se,
        aton_type: fault.aton_type,
        fairway_number: fault.fairway_number,
        fairway_name_fi: fault.fairway_name_fi,
        fairway_name_se: fault.fairway_name_se,
        area_number: fault.area_number,
        area_description: fault.area_description
    };

    // convert geometry from db to geojson
    const geometry = Geometry.parse(Buffer.from(fault.geometry, "hex")).toGeoJSON();

    return <Feature>{
        type: "Feature",
        properties: properties,
        geometry: geometry
    };
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
                'xmlns:gml' : "http://www.opengis.net/gml/3.2",
                'xmlns:S100' : "http://www.iho.int/s100gml/1.0",
                'xmlns:xlink' : "http://www.w3.org/1999/xlink",
                'gml:id' : id
            },
            'gml:boundedBy': {
                'gml:Envelope': {
                    '$': {
                        'srsName': 'EPSG:4326'
                    },
                    'gml:lowerCorner': createCoordinatePair(fault.geometry),
                    'gml:upperCorner': createCoordinatePair(fault.geometry)
                }
            },
            imember: {
                'S124:S124_NWPreamble': {
                    '$': {
                        'gml:id' : `PR.${id}`
                    },
                    id: urn,
                    messageSeriesIdentifier : createMessageSeriesIdentifier(faultId, year),
                    sourceDate: moment(fault.entry_timestamp).format(YEAR_MONTH_DAY),
                    generalArea: 'Baltic sea',
                    locality : {
                        text: fault.fairway_name_fi
                    },
                    title:  {
                        text : `${fault.aton_type} ${fault.aton_name_fi} Nr. ${fault.aton_id}, ${fault.state}`
                    },
                    fixedDateRange : createFixedDateRange(fault),
                }
            },
            member: {
                'S124:S124_NavigationalWarningPart': {
                    '$': {
                        'gml:id' : `NW.${id}.1`
                    },
                    id: `urn:mrn:s124:NW.${id}.1`,
                    geometry: createGeometryElement(fault, id),
                    header: {
                        '$': {
                            'owns': 'true'
                        }
                    }
                }
            }
        }
    };
}

function createFixedDateRange(fault: any) {
    if(fault.fixed_timestamp) {
        return {
            dateStart: {
                date: moment(fault.entry_timestamp).format(YEAR_MONTH_DAY)
            },
            dateEnd: {
                date: moment(fault.fixed_timestamp).format(YEAR_MONTH_DAY)
            }
        }
    }

    return {
        timeOfDayStart: moment(fault.entry_timestamp).format(HOUR_MINUTE_SECOND),
        dateStart: moment(fault.entry_timestamp).format(YEAR_MONTH_DAY) ,
    }
}

function createGeometryElement(fault: any, id: string) {
    return {
        'S100:pointProperty' : {
            'S100:Point' : {
                '$' : {
                    'gml:id' : `s.NW.${id}.1`
                },
                'gml:pos': createCoordinatePair(fault.geometry)
            }
        }
    }
}

function createCoordinatePair(geometry: any) {
    const g = Geometry.parse(Buffer.from(geometry, "hex")).toGeoJSON() as any;

    return`${g.coordinates[0]} ${g.coordinates[1]}`;
}

function createMessageSeriesIdentifier(faultId: any, year: number) {
    return {
        NameOfSeries: NAME_OF_SERIES,
        typeOfWarning : 'local',
        warningNumber : faultId,
        year,
        productionAgency : PRODUCTION_AGENCY,
        country: 'FI'
    };
}

function validate(fault: any) {
    return fault.properties.FAULT_TYPE !== 'Kirjattu';
}