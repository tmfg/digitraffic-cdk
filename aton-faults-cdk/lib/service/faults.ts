import * as LastUpdatedDB from "../../../common/db/last-updated";
import * as FaultsDB from "../db/db-faults"
import {inDatabase} from "../../../common/postgres/database";
import {IDatabase} from "pg-promise";
import {FeatureCollection,Feature,GeoJsonProperties} from "geojson";
import {Geometry} from "wkx";
import {createFeatureCollection} from "../../../common/api/geojson";
import {create, fragment} from "xmlbuilder2";

let moment = require('moment');

const ATON_DATA_TYPE = "ATON_FAULTS";
const YEAR_MONTH_DAY = "YYYY-MM-DD";
const HOUR_MINUTE_SECOND = "HH:MM:SSZ";

export async function findAllFaults(): Promise<FeatureCollection> {
    return await inDatabase(async (db: IDatabase<any,any>) => {
        const annotations = await FaultsDB.findAll(db).then(convertFeatures);
        const lastUpdated = await LastUpdatedDB.getUpdatedTimestamp(db, ATON_DATA_TYPE);

        return createFeatureCollection(annotations, lastUpdated);
    });
}

export async function findAllFaultsS124(): Promise<String> {
    return await inDatabase(async (db: IDatabase<any,any>) => {
        const faults = await FaultsDB.findAll(db);

        return createXmlDocument(faults);
    });
}

function createXmlDocument(faults: any[]) {
    const root = create({version: '1.0', encoding: 'UTF-8'});
    const datasets = root.ele('DataSets');

    faults.forEach(f => {
        datasets.import(createS124(f));
    });

    return {
        body: root.end({ prettyPrint: true })
    }
}

function createS124(fault: any) {
    const faultId = -fault.id;
    const year = fault.entry_timestamp.getFullYear() - 2000;

    const id = `FI.${faultId}.${year}`;
    const urn = `urn:mrn:s124:NW.${id}.P`;

    return fragment()
        .ele('S124:DataSet')
            .att('xmlns:S124', "http://www.iho.int/S124/gml/1.0")
            .att('xsi:schemaLocation', 'http://www.iho.int/S124/gml/1.0 ../../schemas/0.5/S124.xsd')
            .att('xmlns:xsi', "http://www.w3.org/2001/XMLSchema-instance")
            .att('xmlns:gml', "http://www.opengis.net/gml/3.2")
            .att('xmlns:S100', "http://www.iho.int/s100gml/1.0")
            .att('xmlns:xlink', "http://www.w3.org/1999/xlink")
            .att('gml:id', id)
            .ele('imember')
                .ele('S124:S124_Preamble')
                    .att('GML:id', `PR.${id}`)
                    .ele('id').txt(urn).up()
                    .import(createMessageSeriesIdentifier(faultId, year))
                    .ele('sourceDate').txt(fault.entry_timestamp.toISOString()).up()
                    .ele('generalArea').txt(`${fault.area_description_fi}, ${fault.fairway_name_fi}`).up()
                    .ele('locality')
                        .ele('text').txt(`${fault.aton_type_fi}, ${fault.aton_name_fi}`).up()
                    .up()
                    .ele('title')
                        .ele('text').txt(fault.type).up()
                    .up()
                    .import(createFixedDateRange(fault))
                .up()
            .up()
            .ele('member')
                .ele('S124:S124_NavigationalWarningPart')
                    .att('GML:id', `NW.${id}.1`)
                    .ele('id').txt(`${urn}.1`).up()
                        .import(createGeometryElement(fault, id))
                .up()
            .up()
        .up();
}

function createFixedDateRange(fault: any) {
    const f = fragment()
        .ele('fixedDateRange')
            .ele('timeOfDayStart').txt(moment(fault.entry_timestamp).format(YEAR_MONTH_DAY)).up()
            .ele('dateStart').txt(moment(fault.entry_timestamp).format(HOUR_MINUTE_SECOND)).up();

    if(fault.fixed_timestamp) {
        return f.ele('timeOfDayEnd').txt(moment(fault.fixed_timestamp).format(YEAR_MONTH_DAY)).up()
                .ele('dateEnd').txt(moment(fault.fixed_timestamp).format(HOUR_MINUTE_SECOND)).up();
    }

    return f;
}

function createGeometryElement(fault: any, id: string) {
    return fragment()
        .ele('geometry')
            .ele('S100:pointProperty')
                .att('gml:id', `s.NW.${id}.1`)
                .att('srcName', 'EPSG:4326')
                .ele('gml:pos')
                    .import(createPoint(fault.geometry))
                .up()
            .up()
        .up()
}

function createPoint(geometry: any) {
    const g = Geometry.parse(Buffer.from(geometry, "hex")).toGeoJSON() as any;

    console.info('g ' + JSON.stringify(g));

    return fragment()
        .ele('gml:pos').txt(`${g.coordinates[0]} ${g.coordinates[1]}`).up();
}

function createMessageSeriesIdentifier(faultId: any, year: number) {
    return fragment()
        .ele('messageSeriesIdentifier')
            .ele('NameOfSeries').txt('Finnish Nav Warn').up()
            .ele('typeOfWarning').txt('local').up()
            .ele('warningNumber').txt(faultId).up()
            .ele('year').txt(year.toString()).up()
            .ele('productionAgency')
                .ele('language').txt('fin').up()
                .ele('text').txt('Finnish Maritime Agency').up()
            .up()
            .ele('country').txt('fi').up()
        .up();
}

function convertFeatures(fa: any[]) {
    return fa.map(a => {
        const properties = <GeoJsonProperties>{
            id: a.id,
            entry_timestamp: a.entry_timestamp,
            fixed_timestamp: a.fixed_timestamp,
            type: a.type,
            domain: a.domain,
            state: a.state,
            fixed: a.fixed,
            aton_id: a.aton_id,
            aton_name_fi: a.aton_name_fi,
            aton_name_se: a.aton_name_se,
            aton_type_fi: a.aton_type_fi,
            aton_type_se: a.aton_type_se,
            fairway_number: a.fairway_number,
            fairway_name_fi: a.fairway_name_fi,
            fairway_name_se: a.fairway_name_se,
            area_number: a.area_number,
            area_description_fi: a.area_description_fi,
            area_description_se: a.area_description_se
        };

        // convert geometry from db to geojson
        const geometry = Geometry.parse(Buffer.from(a.geometry, "hex")).toGeoJSON();

        return <Feature>{
            type: "Feature",
            properties: properties,
            geometry: geometry
        };
    })
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