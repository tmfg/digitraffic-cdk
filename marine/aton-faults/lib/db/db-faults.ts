import {IDatabase, PreparedStatement} from "pg-promise";
import {createGeometry} from "../../../../common/postgres/geometry";
import {stream} from "../../../../common/db/stream-util";
import {Language} from "../../../../common/model/language";

const QueryStream = require('pg-query-stream');
const moment = require('moment-timezone');

const UPSERT_FAULTS_SQL =
    `insert into aton_fault(id, entry_timestamp, fixed_timestamp, state, type, domain, fixed, aton_id, aton_name_fi, aton_name_se, 
    aton_type_fi, fairway_number, fairway_name_fi, fairway_name_se, area_number, geometry)
    values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    on conflict(id)
    do update set
      entry_timestamp=$2,
      fixed_timestamp=$3,
      state=$4,
      fixed=$7`;

const ALL_FAULTS_JSON_SQL =
    `select id, entry_timestamp, fixed_timestamp, aton_fault_type.name_LANG aton_fault_type, domain, aton_fault_state.name_LANG state, fixed,
    aton_id, aton_name_fi, aton_name_se, aton_type.name_LANG aton_type,
    fairway_number, fairway_name_fi, fairway_name_se, area.area_number, area.description_LANG area_description, geometry
    from aton_fault, area, aton_fault_type, aton_fault_state, aton_type
    where aton_fault.area_number = area.area_number
    and (aton_fault.fixed_timestamp is null or aton_fault.fixed_timestamp >= $1)
    and aton_fault.state = aton_fault_state.name_fi
    and aton_fault.type = aton_fault_type.name_fi
    and aton_fault.aton_type_fi = aton_type.name_fi`;

const ALL_FAULTS_S124_WITH_DOMAIN_SQL =
    `select id, entry_timestamp, fixed_timestamp, aton_fault_type.name_en fault_type_en, aton_id, aton_name_fi, aton_type.name_en, 
        fairway_name_fi, description_en area_description_en, geometry
    from aton_fault, area, aton_fault_type, aton_type
    where domain in ('C_NA', 'C_NM') 
    and aton_fault.area_number = area.area_number
    and aton_fault.type = aton_fault_type.name_fi
    and aton_fault.aton_type_fi = aton_type.name_fi`;

const langRex = /LANG/g;

export async function streamAllForJson(db: IDatabase<any, any>, language: Language, fixedInHours: number, conversion: (fault: any) => any) {
    const fixedLimit = moment().subtract(fixedInHours, 'hour').toDate();

    const qs = new QueryStream(
        ALL_FAULTS_JSON_SQL.replace(langRex, language.toString()), [fixedLimit]
    );

    return await stream(db, qs, conversion);
}

export async function streamAllForS124(db: IDatabase<any, any>, conversion: (fault: any) => any) {
    const qs = new QueryStream(ALL_FAULTS_S124_WITH_DOMAIN_SQL);

    return await stream(db, qs, conversion);
}

export function updateFaults(db: IDatabase<any, any>, domain: string, faults: any[]): Promise<any>[] {
    const ps = new PreparedStatement({
        name: 'update-faults',
        text: UPSERT_FAULTS_SQL,
    });

    return faults.map(f => {
        const p = f.properties;

        return db.none(ps, [
            p.ID,
            parseHelsinkiTime(p.FAULT_ENTRY_TIMESTAMP),
            parseHelsinkiTime(p.FAULT_FIXED_TIMESTAMP),
            p.FAULT_STATE,
            p.FAULT_TYPE,
            domain,
            p.FAULT_FIXED == 1 ? true : false,
            p.TL_NUMERO,
            p.TL_NIMI_FI,
            p.TL_NIMI_SE,
            p.TL_TYYPPI_FI,
            p.VAYLA_JNRO,
            p.VAYLA_NIMI_FI,
            p.VAYLA_NIMI_SE,
            p.MERIALUE_NRO,
            createGeometry(f.geometry)
        ]);
    });
}

function parseHelsinkiTime(date: string|null): Date|null {
    if(date == null) {
        return null;
    }

    // incoming dates are in Finnish-time without timezone-info, this propably handles it correctly
    // it also has no leading zeros in days, months or hours
    const helsinkiDate = moment.tz(date, 'D.M.YYYY H:mm', 'Europe/Helsinki').toDate();

//    console.info("%s -> %s !", date, helsinkiDate);

    return helsinkiDate;
}
