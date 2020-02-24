import * as LastUpdatedDB from "../../../common/db/last-updated";
import * as FaultsDB from "../db/db-faults"
import {inDatabase} from "../../../common/postgres/database";
import {IDatabase} from "pg-promise";
import {FeatureCollection,Feature,GeoJsonProperties} from "geojson";
import {Geometry} from "wkx";
import {createFeatureCollection} from "../../../common/api/geojson";
import {create, fragment} from "xmlbuilder2";

const ATON_DATA_TYPE = "ATON_FAULTS";
const S124_NAMESPACE = "http://www.iho.int/S124/gml/1.0";
const GML_NAMESPACE = "http://www.opengis.net/gml/3.2";

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
    const root = create({version: '1.0', encoding: 'UTF-8', namespaceAlias: {
            'S124' : S124_NAMESPACE
        }});

    const datasets = root.ele('DataSets');

    faults.forEach(f => {
        datasets.import(createS124(f));
    });

    return {
        body: root.end()
    }
}

function createS124(fault: any) {
    const faultId = -fault.id;
    const year = fault.entry_timestamp.getFullYear() - 2000;

    const id = `FI.${faultId}.${year}`;
    const urn = `urn:mrn:s124:NW:${id}.P`;

    return fragment()
        .ele(S124_NAMESPACE, 'DataSet')
            .ele('imember')
                .ele(S124_NAMESPACE, 'S124_Preamble')
                    .att(GML_NAMESPACE, 'id', 'PR,' + id)
                    .ele({id: urn})
                    .ele(createMessageSeriesIdentifier(faultId, year))
                .up()
            .up()
            .ele('member')
                .ele(S124_NAMESPACE, 'S124_NavigationalWarningPart')
                    .att(GML_NAMESPACE, 'id', 'NW.' + id + '.1')
                .ele({id: urn + '.1'})
            .up()
        .up();
}

function createMessageSeriesIdentifier(faultId: any, year: number) {
    return fragment()
        .ele('messageSeriesIdentifier')
            .ele('NameOfSeries').txt('moi')
            .ele('typeOfWarning').txt('local')
            .ele('warningNumber').txt(faultId)
            .ele('year').txt(year.toString())
            .ele('productionAgency')
                .ele('language').txt('eng')
                .ele('text').txt('Finnish Maritime Agency')
                .up()
            .ele('country').txt('fi')
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