import {initDbConnection} from 'digitraffic-lambda-postgres/database';
import {IDatabase} from "pg-promise";
import {getStates} from "../../api/api-states";
import {update} from "../../db/db-states";

let db: IDatabase<any, any>;

export const handler = async (
    event: any,
    context: any,
    callback: any,
    dbParam?: IDatabase<any, any>
): Promise<any> => {
    const endpointUser = process.env.ENDPOINT_USER as string;
    const endpointPass = process.env.ENDPOINT_PASS as string;
    const endpointUrl = process.env.ENDPOINT_URL as string;
    try {
        const services = await getStates(endpointUser, endpointPass, endpointUrl);
        db = db ? db : dbParam ? dbParam : initDbConnection(
            process.env.DB_USER as string,
            process.env.DB_PASS as string,
            process.env.DB_URI as string
        );
        await update(db, services);
    } catch (e) {
        console.error('Error', e);
        return;
    }
};
