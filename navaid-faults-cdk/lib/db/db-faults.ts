import {IDatabase} from "pg-promise";
import {createGeometry} from "../../../common/postgres/geometry";

let moment = require('moment');

const UPSERT_FAULTS_SQL = "insert into navaid_fault(id, entry_timestamp, fixed_timestamp, state, type, domain, fixed, " +
    "navaid_id, navaid_name_fi, navaid_name_se, navaid_type_fi, navaid_type_se, " +
    "fairway_number, fairway_name_fi, fairway_name_se," +
    "area_number, area_description_fi, area_description_se, geometry)" +
    " values(${id}, ${entry_timestamp}, ${fixed_timestamp}, ${state}, ${type}, ${domain}, ${fixed}, " +
    " ${navaid_id},${navaid_name_fi}, ${navaid_name_se}, ${navaid_type_fi}, ${navaid_type_se}," +
    "  ${fairway_number}, ${fairway_name_fi}, ${fairway_name_se}, " +
    " ${area_number}, ${area_description_fi}, ${area_description_se}, ${geometry})" +
    " on conflict(id)" +
    " do update set" +
    "   fixed_timestamp=${fixed_timestamp}," +
    "   fixed=${fixed}";

const FIND_ALL_SQL = "select id, entry_timestamp, fixed_timestamp, type, domain, fixed, geometry" +
    " from navaid_fault";

export async function findAll(db: IDatabase<any, any>) {
    return await db.manyOrNone(FIND_ALL_SQL);
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
            navaid_id: p.TL_NUMERO,
            navaid_name_fi: p.TL_NIMI_FI,
            navaid_name_se: p.TL_NIMI_SE,
            navaid_type_fi: p.TL_TYYPPI_FI,
            navaid_type_se: p.TL_TYYPPI_SE,
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
