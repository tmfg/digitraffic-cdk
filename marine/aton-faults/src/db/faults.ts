import { default as pgPromise } from "pg-promise";
import { createGeometry } from "@digitraffic/common/dist/utils/geometry";
import type { LineString } from "wkx";
import type { DbFault, FaultFeature } from "../model/fault.js";
import type { Language } from "@digitraffic/common/dist/types/language";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { subHours } from "date-fns";
import { TZDate } from "@date-fns/tz";

// 15 nautical miles
const BUFFER_RADIUS_METERS = 27780;

const langRex = /LANG/g;

const ALL_FAULTS_JSON_SQL = `select id,
            entry_timestamp,
            fixed_timestamp,
            aton_fault_type.name_LANG aton_fault_type,
            domain,
            aton_fault_state.name_LANG state,
            fixed,
            aton_id,
            aton_name_fi,
            aton_name_sv,
            aton_type.name_LANG aton_type,
            fairway_number,
            fairway_name_fi,
            fairway_name_sv,
            area.area_number,
            area.description_LANG area_description,
            geometry
    from aton_fault, area, aton_fault_type, aton_fault_state, aton_type
    where aton_fault.area_number = area.area_number
    and (aton_fault.fixed_timestamp is null or aton_fault.fixed_timestamp >= $1)
    and aton_fault.state = aton_fault_state.name_fi
    and aton_fault.type = aton_fault_type.name_fi
    and aton_fault.aton_type_fi = aton_type.name_fi`;

const UPSERT_FAULTS_SQL =
  `insert into aton_fault(id, entry_timestamp, fixed_timestamp, state, type, domain, fixed, aton_id, aton_name_fi, aton_name_sv, 
    aton_type_fi, fairway_number, fairway_name_fi, fairway_name_sv, area_number, geometry)
    values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    on conflict(id)
    do update set
      entry_timestamp=$2,
      fixed_timestamp=$3,
      state=$4,
      fixed=$7`;

const GET_FAULT_BY_ID = `
    select
        id,
        entry_timestamp,
        fixed_timestamp,
        aton_fault_type.name_en aton_fault_type,
        domain,
        aton_fault_state.name_en state,
        fixed,
        aton_id,
        aton_name_fi,
        aton_name_sv,
        aton_type.name_en aton_type,
        fairway_number,
        fairway_name_fi,
        fairway_name_sv,
        area.area_number,
        area.description_en area_description,
        geometry
    from aton_fault, area, aton_fault_type, aton_fault_state, aton_type
    where
        id = $1
        and state IN ('Avoin', 'Kirjattu')
        and aton_fault.area_number = area.area_number
        and aton_fault.state = aton_fault_state.name_fi
        and aton_fault.type = aton_fault_type.name_fi
        and aton_fault.aton_type_fi = aton_type.name_fi
    
`;

// find faults that are relevant for ships
// return only commercial & non-commercial ATON faults, not any other type of faults
// transform given ship route (linestring) from wgs84 to etrs89 / tm35fin for metric buffering and then back to wgs84
const FAULT_IDS_BY_AREA = `select id
     from aton_fault, area, aton_fault_type, aton_type
     where domain in ('C_NA', 'NC_NA') 
     and aton_fault.area_number = area.area_number
     and aton_fault.type = aton_fault_type.name_fi
     and aton_fault.aton_type_fi = aton_type.name_fi
     and state IN ('Avoin', 'Kirjattu')
     and st_intersects(
         st_setsrid(geometry, 4326),
         st_transform(
             st_buffer(
                 st_transform(
                     st_geomfromtext($1, 4326), 3067
                 )
                 , ${BUFFER_RADIUS_METERS})
         , 4326)
     )
`;

const PS_FAULT_BY_ID = new pgPromise.PreparedStatement({
  name: "get-fault-by-id",
  text: GET_FAULT_BY_ID,
});

const PS_FAULT_IDS_BY_AREA = new pgPromise.PreparedStatement({
  name: "get-fault-ids-by-area",
  text: FAULT_IDS_BY_AREA,
});

export function getFaultById(
  db: DTDatabase,
  faultId: number,
): Promise<DbFault | undefined> {
  return db.oneOrNone(PS_FAULT_BY_ID, [faultId]).then((
    result: DbFault | null,
  ) => result ?? undefined);
}

interface DbFaultId {
  readonly id: string;
}

export function findFaultIdsByRoute(
  db: DTDatabase,
  route: LineString,
): Promise<number[]> {
  const ids = db.tx((t) => t.manyOrNone(PS_FAULT_IDS_BY_AREA, route.toWkt()));
  // bigints are returned as string by pg-promise since they could overflow
  // however these are plain integers
  return ids.then((result: DbFaultId[]) => result.map((r) => Number(r.id)));
}

export function updateFaults(
  db: DTDatabase,
  domain: string,
  faults: FaultFeature[],
): Promise<unknown>[] {
  const ps = new pgPromise.PreparedStatement({
    name: "update-faults",
    text: UPSERT_FAULTS_SQL,
  });

  return faults.map((f) => {
    const p = f.properties;

    return db.none(ps, [
      p.ID,
      parseHelsinkiTime(p.FAULT_ENTRY_TIMESTAMP),
      parseHelsinkiTime(p.FAULT_FIXED_TIMESTAMP),
      p.FAULT_STATE,
      p.FAULT_TYPE,
      domain,
      p.FAULT_FIXED === 1,
      p.TL_NUMERO,
      p.TL_NIMI_FI,
      p.TL_NIMI_SE,
      p.TL_TYYPPI_FI,
      p.VAYLA_JNRO,
      p.VAYLA_NIMI_FI,
      p.VAYLA_NIMI_SE,
      p.MERIALUE_NRO,
      createGeometry(f.geometry),
    ]);
  });
}

export function findAll<T>(
  db: DTDatabase,
  language: Language,
  fixedInHours: number,
  conversion: (fault: DbFault) => T,
): Promise<T[]> {
  const fixedLimit = subHours(Date.now(), fixedInHours);
  const ps = new pgPromise.PreparedStatement({
    name: "get-all-faults",
    text: ALL_FAULTS_JSON_SQL.replace(langRex, language.toString()),
  });

  return db.manyOrNone(ps, [fixedLimit]).then((faults) =>
    faults.map(conversion)
  );
}

// eslint-disable-next-line @rushstack/no-new-null
function parseHelsinkiTime(date: string | null): Date | undefined {
  if (date !== null) {
    // incoming dates are in Finnish-time without timezone-info, this probably handles it correctly
    return new TZDate(date, "Europe/Helsinki");
  }

  return undefined;
}
