import {initDbConnection} from 'digitraffic-lambda-postgres/database';
import {findAll} from "../../db/db-states";
import * as pgPromise from "pg-promise";

let db: pgPromise.IDatabase<any, any> | null  = null;

export const handler = async (
    dbParam?: pgPromise.IDatabase<any, any>
): Promise<any> => {
    db = db ? db : dbParam ? dbParam : initDbConnection(
        process.env.DB_USER as string,
        process.env.DB_PASS as string,
        process.env.DB_URI as string
    );

    const states = await findAll(db);

    return states;
};
