import {IDatabase} from "pg-promise";
import {createGeometry} from "../../../common/postgres/geometry";
import {stream} from "../../../common/db/stream-util";

const QueryStream = require('pg-query-stream')
const moment = require('moment');

const UPSERT_FAULTS_SQL = "insert into aton_fault(id, entry_timestamp, fixed_timestamp, state, type, domain, fixed, " +
    "aton_id, aton_name_fi, aton_name_se, aton_type_fi, aton_type_se, " +
    "fairway_number, fairway_name_fi, fairway_name_se," +
    "area_number, area_description_fi, area_description_se, geometry)" +
    " values(${id}, ${entry_timestamp}, ${fixed_timestamp}, ${state}, ${type}, ${domain}, ${fixed}, " +
    " ${aton_id},${aton_name_fi}, ${aton_name_se}, ${aton_type_fi}, ${aton_type_se}," +
    "  ${fairway_number}, ${fairway_name_fi}, ${fairway_name_se}, " +
    " ${area_number}, ${area_description_fi}, ${area_description_se}, ${geometry})" +
    " on conflict(id)" +
    " do update set" +
    "   fixed_timestamp=${fixed_timestamp}," +
    "   fixed=${fixed}";

const REMOVE_FAULTS_SQL = "delete from aton_fault where domain=${domain}";

const ALL_FAULTS_JSON_SQL = "select id, entry_timestamp, fixed_timestamp, type, domain, state, fixed, " +
    " aton_id, aton_name_fi, aton_name_se, aton_type_fi, aton_type_se, " +
    " fairway_number, fairway_name_fi, fairway_name_se, area_number, area_description_fi, area_description_se, geometry" +
    " from aton_fault";

const ALL_FAULTS_S124_WITH_DOMAIN_SQL = "select id, entry_timestamp, fixed_timestamp, type, " +
    " aton_id, aton_name_fi, aton_type_fi, " +
    " fairway_name_fi, area_description_fi, geometry" +
    " from aton_fault" +
    " where domain in ('C_NA', 'C_NM')";

const DOMAINS_FOR_S124 = ['C_NA', 'C_NM'];

export async function streamAllForJson(db: IDatabase<any, any>, conversion: (fault: any) => any) {
    const qs = new QueryStream(ALL_FAULTS_JSON_SQL);

    return await stream(db, qs, conversion);
}

export async function streamAllForS124(db: IDatabase<any, any>, conversion: (fault: any) => any) {
    //const qs = new QueryStream(ALL_FAULTS_S124_WITH_DOMAIN_SQL, {domains: DOMAINS_FOR_S124});
    const qs = new QueryStream(ALL_FAULTS_S124_WITH_DOMAIN_SQL);

    return await stream(db, qs, conversion);
}

export function updateFaults(db: IDatabase<any, any>, domain: string, faults: any[]): any[] {
    let promises: any[] = [];

    faults.forEach(f => {
//        console.info("fault:" + JSON.stringify(f));

        const p = f.properties;
        promises.push(db.none(UPSERT_FAULTS_SQL, {
            id: p.ID,
            entry_timestamp: toHelsinkiTime(p.FAULT_ENTRY_TIMESTAMP),
            fixed_timestamp: toHelsinkiTime(p.FAULT_FIXED_TIMESTAMP),
            state: p.FAULT_STATE,
            type: p.FAULT_TYPE,
            domain: domain,
            fixed: p.FAULT_FIXED == 1 ? true : false,
            aton_id: p.TL_NUMERO,
            aton_name_fi: p.TL_NIMI_FI,
            aton_name_se: p.TL_NIMI_SE,
            aton_type_fi: p.TL_TYYPPI_FI,
            aton_type_se: p.TL_TYYPPI_SE,
            fairway_number: p.VAYLA_JNRO,
            fairway_name_fi: p.VAYLA_NIMI_FI,
            fairway_name_se: p.VAYLA_NIMI_SE,
            area_number: p.MERIALUE_NRO,
            area_description_fi: p.MERIALUE_SELITYS_FI,
            area_description_se: p.MERIALUE_SELITYS_SE,
            geometry: createGeometry(f.geometry)
        }));
    });

    return promises;
}

function toHelsinkiTime(date: string|null): Date|null {
    if(date == null) {
        return null;
    }

    return moment(date, 'dd.MM.yyyy hh:mm').toDate();
}
