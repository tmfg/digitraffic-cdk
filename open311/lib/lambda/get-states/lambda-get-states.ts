import {initDbConnection} from 'digitraffic-lambda-postgres/database';
import {findAll} from "../../db/db-states";
import {IDatabase} from "pg-promise";

let db: IDatabase<any, any> | null  = null;

export const handler = async (
    event: any,
    context: any,
    callback: any,
    dbParam?: IDatabase<any, any>
): Promise<any> => {
    db = db ?? dbParam ?? initDbConnection(
        process.env.DB_USER as string,
        process.env.DB_PASS as string,
        process.env.DB_URI as string
    );

    const states = await findAll(db);
    return states;
};
