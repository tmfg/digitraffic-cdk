import {initDbConnection} from 'digitraffic-lambda-postgres/database';
import {findAll} from "../../db/db-services";
import * as pgPromise from "pg-promise";

let db: pgPromise.IDatabase<any, any>;

export const handler = async (
    event: any,
    context: any,
    callback: any,
    dbParam?: pgPromise.IDatabase<any, any>
): Promise<any> => {
    db = db ? db : dbParam ? dbParam : initDbConnection(
        process.env.DB_USER as string,
        process.env.DB_PASS as string,
        process.env.DB_URI as string
    );

    const services = await findAll(db);

    return services;
};
