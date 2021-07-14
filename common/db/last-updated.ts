import {IDatabase} from "pg-promise";

export enum DataType {
    NW2_ANNOTATIONS="NW2_ANNOTATIONS",
    VS_DATEX2="VS_DATEX2"
}

export function getLastUpdated(db: IDatabase<any, any>, datatype: DataType): Promise<Date | null> {
    return db.oneOrNone("select updated from data_updated where data_type=$(datatype)", {
        datatype: datatype
    }, (x: { updated: any; } | null) => x?.updated);
}

export function updateLastUpdated(db: IDatabase<any, any>, datatype: DataType, date: Date): Promise<null> {
    return db.none("update data_updated set updated=$(date) where data_type=$(datatype)",
        {
            date: date,
            datatype: datatype
        });
}

export function getUpdatedTimestamp(db: IDatabase<any, any>, datatype: string): Promise<Date | null> {
    return db.oneOrNone("select updated_time from updated_timestamp where updated_name=$(datatype)", {
        datatype: datatype
    }, (x: { updated_time: any; } | null) => x?.updated_time);
}

export function updateUpdatedTimestamp(db: IDatabase<any, any>, datatype: string, date: Date, by: string = ''): Promise<null> {
    return db.none(
`insert into updated_timestamp(updated_name, updated_time, updated_by)
values($(datatype), $(date), $(by))
on conflict (updated_name)
do update set updated_time = $(date), updated_by = $(by)`,
        {
            date: date,
            datatype: datatype,
            by: by
        });
}

