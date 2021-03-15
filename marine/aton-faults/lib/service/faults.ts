import * as LastUpdatedDB from "../../../../common/db/last-updated";
import * as FaultsDB from "../db/db-faults"
import {inDatabase} from "../../../../common/postgres/database";
import {IDatabase} from "pg-promise";
import {Geometry, LineString, Point} from "wkx";
import {Builder} from 'xml2js';
import {RtzVoyagePlan} from "../model/voyageplan";
import {findFaultIdsByRoute} from "../db/db-faults";

let moment = require('moment');

const ATON_DATA_TYPE = "ATON_FAULTS";
const YEAR_MONTH_DAY = "YYYY-MM-DD";
const HOUR_MINUTE_SECOND = "HH:MM:SSZ";

const PRODUCTION_AGENCY = {
    'language' : 'fin',
    'text' : 'Finnish Transport Infrastructure Agency'
};

const NAME_OF_SERIES = 'Finnish ATON Faults';

export async function getFaultS124ById(faultId: number): Promise<any> {
    const start = Date.now();

    const fault = await inDatabase(async (db: IDatabase<any,any>) => {
        return await FaultsDB.getFaultById(db, faultId);
    });

    try {
        return {
            body: new Builder().buildObject({
                'DataSets': createXml(fault)
            })
        }
    } finally {
        console.info("method=getFaultS124ById tookMs=%d", Date.now() - start);
    }
}

export async function findFaultIdsForVoyagePlan(voyagePlan: RtzVoyagePlan): Promise<number[]> {
    const start = Date.now();
    const voyageLineString =
        new LineString(voyagePlan.route.waypoints
            .flatMap(w => w.waypoint.flatMap(x => x.position))
            .map(p => new Point(p.$.lat, p.$.lon)));
    const faultIds = await inDatabase(async (db: IDatabase<any,any>) => {
        return findFaultIdsByRoute(db, voyageLineString);
    });
    console.info("method=findFaultIdsForVoyagePlan tookMs=%d", Date.now() - start);
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
                    'generalArea': fault.area_description_en,
                    'locality' : {
                        'text': fault.fairway_name_fi
                    },
                    'title':  {
                        'text' : `${fault.aton_type_en} ${fault.aton_name_fi} Nr. ${fault.aton_id}, ${fault.fault_type_en}`
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

function validate(fault: any) {
    return fault.properties.FAULT_TYPE !== 'Kirjattu';
}