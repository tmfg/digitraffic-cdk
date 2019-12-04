import {APIGatewayEvent} from 'aws-lambda';
import {initDbConnection} from 'digitraffic-lambda-postgres/database';
import {ServiceRequest} from "../../model/service-request";
import {update} from "../../db/db-requests";
import {invalidRequest, serverError} from "../../http-util";
import * as pgPromise from "pg-promise";

export const handler = async (event: APIGatewayEvent): Promise<any> => {
    if (!event.body) {
        return invalidRequest();
    }

    const obj = JSON.parse(event.body);
    const serviceRequests: ServiceRequest[] = Array.isArray(obj) ? obj as ServiceRequest[] : [obj];

    if (serviceRequests.length == 0) {
        return invalidRequest();
    }

    const db = initDbConnection(
        process.env.DB_USER as string,
        process.env.DB_PASS as string,
        process.env.DB_URI as string
    );

    try {
        return await doUpdate(db, serviceRequests);
    } catch (e) {
        console.error('Error', e);
        return serverError();
    } finally {
        db.$pool.end();
    }
};

async function doUpdate(db: pgPromise.IDatabase<any, any>, serviceRequests: ServiceRequest[]) {
    await update(db, serviceRequests);
    return {statusCode: 201, body: 'Created'};
}
