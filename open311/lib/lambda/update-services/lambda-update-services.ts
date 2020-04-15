import {initDbConnection} from 'digitraffic-lambda-postgres/database';
import * as pgPromise from "pg-promise";
import {getServices} from "../../api/api-services";
import {update} from "../../db/db-services";

let db: pgPromise.IDatabase<any, any>;

export const handler = async (
    event: any,
    context: any,
    callback: any,
    dbParam?: pgPromise.IDatabase<any, any>
): Promise<any> => {
    const endpointUser = process.env.ENDPOINT_USER as string;
    const endpointPass = process.env.ENDPOINT_PASS as string;
    const endpointUrl = process.env.ENDPOINT_URL as string;
    const services = await getServices(endpointUser, endpointPass, endpointUrl);
    db = db ? db : dbParam ? dbParam : initDbConnection(
        process.env.DB_USER as string,
        process.env.DB_PASS as string,
        process.env.DB_URI as string
    );
    await update(db, services);
};
