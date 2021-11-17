import {DTDatabase} from "../postgres/database";

export enum DataType {
    VS_DATEX2="VS_DATEX2",
    COUNTING_SITES_DATA="COUNTING_SITES_DATA",
    COUNTING_SITES_METADATA="COUNTING_SITES_METADATA",
    COUNTING_SITES_METADATA_CHECK="COUNTING_SITES_METADATA_CHECK"
}

export function getLastUpdated(db: DTDatabase, datatype: DataType): Promise<Date | null> {
    return db.oneOrNone("select updated from data_updated where data_type=$(datatype)", {
        datatype: datatype
    }, (x: { updated: any; } | null) => x?.updated);
}

export function updateLastUpdated(db: DTDatabase, datatype: DataType, updated: Date): Promise<null> {
    return db.none(`insert into data_updated(id, data_type, updated)
values(nextval('seq_data_updated'), $(datatype), $(updated))
on conflict (data_type)
do update set updated = $(updated)`,
        { updated, datatype });
}

export function getUpdatedTimestamp(db: DTDatabase, datatype: string): Promise<Date | null> {
    return db.oneOrNone("select updated_time from updated_timestamp where updated_name=$(datatype)", {
        datatype: datatype
    }, (x: { updated_time: any; } | null) => x?.updated_time);
}

export function updateUpdatedTimestamp(db: DTDatabase, datatype: string, date: Date, by = ''): Promise<null> {
    return db.none(
`insert into updated_timestamp(updated_name, updated_time, updated_by)
values($(datatype), $(date), $(by))
on conflict (updated_name)
do update set updated_time = $(date), updated_by = $(by)`,
        { date, datatype, by });
}

