import {DTDatabase, DTTransaction} from "./database";

export enum DataType {
    VS_DATEX2="VS_DATEX2",
    COUNTING_SITES_DATA="COUNTING_SITES_DATA",
    COUNTING_SITES_METADATA="COUNTING_SITES_METADATA",
    COUNTING_SITES_METADATA_CHECK="COUNTING_SITES_METADATA_CHECK",
    MAINTENANCE_TRACKING_DATA_CHECKED="MAINTENANCE_TRACKING_DATA_CHECKED",
    PERMIT_DATA="PERMIT_DATA",
    PERMIT_DATA_CHECK="PERMIT_DATA_CHECK",
}

const UNSET_SUBTYPE = '-';

type UpdatedTimestamp = {
    updated: Date
} | null;

export function getLastUpdated(db: DTDatabase, datatype: DataType): Promise<Date | null> {
    return db.oneOrNone("select updated from data_updated where data_type=$(datatype) and subtype=$(subtype)", {
        datatype: datatype, subtype: UNSET_SUBTYPE,
    }, (x: UpdatedTimestamp) => x?.updated || null);
}

export function getLastUpdatedWithSubtype(db: DTDatabase, datatype: DataType, subtype: string): Promise<Date | null> {
    return db.oneOrNone("SELECT updated FROM data_updated WHERE data_type=$(datatype) AND subtype=$(subtype)", {
        datatype: datatype, subtype: subtype,
    }, (x: UpdatedTimestamp) => x?.updated || null);
}

export function updateLastUpdated(db: DTDatabase | DTTransaction, datatype: DataType, updated: Date): Promise<null> {
    return db.none(`insert into data_updated(id, data_type, updated)
 values(nextval('seq_data_updated'), $(datatype), $(updated))
 on conflict (data_type, subtype)
 do update set updated = $(updated)`,
    { updated, datatype });
}

export function updateLastUpdatedWithSubtype(db: DTDatabase | DTTransaction, datatype: DataType, subtype: string, updated: Date): Promise<null> {
    return db.none(`insert into data_updated(id, data_type, subtype, updated)
 values(nextval('seq_data_updated'), $(datatype), $(subtype), $(updated))
 on conflict (data_type, subtype)
 do update set updated = $(updated)`,
    { updated, subtype, datatype });
}

export function getUpdatedTimestamp(db: DTDatabase, datatype: string): Promise<Date | null> {
    return db.oneOrNone("select updated_time as updated from updated_timestamp where updated_name=$(datatype)", {
        datatype: datatype,
    }, (x: UpdatedTimestamp) => x?.updated || null);
}

export function updateUpdatedTimestamp(db: DTDatabase | DTTransaction, datatype: string, date: Date, by = ''): Promise<null> {
    return db.none(`insert into updated_timestamp(updated_name, updated_time, updated_by)
values($(datatype), $(date), $(by))
on conflict (updated_name)
do update set updated_time = $(date), updated_by = $(by)`,
    { date, datatype, by });
}
