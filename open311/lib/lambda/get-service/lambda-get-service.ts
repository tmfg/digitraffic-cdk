import {initDbConnection} from 'digitraffic-lambda-postgres/database';
import {find} from "../../db/db-services";
import {NOT_FOUND_MESSAGE} from 'digitraffic-cdk-api/errors';
import {IDatabase} from "pg-promise";

let db: IDatabase<any, any>;

export const handler = async (
    event: any,
    context: any,
    callback: any,
    dbParam?: IDatabase<any, any>
) : Promise <any> => {
    const serviceId = event['service_id'] as string | null;

    db = db ? db : dbParam ? dbParam : initDbConnection(
        process.env.DB_USER as string,
        process.env.DB_PASS as string,
        process.env.DB_URI as string
    );

    const service = await find(db, serviceId as string);

    if (!service) {
        throw new Error(NOT_FOUND_MESSAGE);
    }

    return service;
};
