import * as pgPromise from "pg-promise";

const NW2_DATA_TYPE = "NW2_ANNOTATIONS";

export function getLastUpdated(db: pgPromise.IDatabase<any, any>): Promise<Date | null> {
    return db.oneOrNone("select updated from data_updated where data_type=${datatype}", {
        datatype: NW2_DATA_TYPE
    }, (x: { updated: any; }) => x.updated);
}

export function updateLastUpdated(db: pgPromise.IDatabase<any, any>, date: Date): Promise<null> {
    return db.none("update data_updated set updated=${date} where data_type=${datatype}",
        {
            date: date,
            datatype: NW2_DATA_TYPE
        });
}