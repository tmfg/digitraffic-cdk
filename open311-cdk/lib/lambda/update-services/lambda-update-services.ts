import {initDbConnection} from 'digitraffic-lambda-postgres/database';
import * as pgPromise from "pg-promise";
import {getServices} from "../../api/api-services";
import {update} from "../../db/db-services";

export const handler = async (): Promise<any> => {
    const endpointUser = process.env.ENDPOINT_USER as string;
    const endpointPass = process.env.ENDPOINT_PASS as string;
    const endpointUrl = process.env.ENDPOINT_URL as string;
    let db: pgPromise.IDatabase<any,any> | null = null;
    try {
        const services = await getServices(endpointUser, endpointPass, endpointUrl);
        db = initDbConnection(
            process.env.DB_USER as string,
            process.env.DB_PASS as string,
            process.env.DB_URI as string
        );
        await update(db, services);
    } catch (e) {
        console.error('Error', e);
        return;
    } finally {
        if (db != null) {
            db.$pool.end()
        }
    }
};
