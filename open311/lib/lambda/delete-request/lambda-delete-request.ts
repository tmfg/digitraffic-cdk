import {initDbConnection} from 'digitraffic-lambda-postgres/database';
import {doDelete} from "../../service/requests";
import {IDatabase} from "pg-promise";

let db: IDatabase<any, any>;

export const handler = async (
    event: DeleteRequestEvent,
    context: any,
    callback: any,
    dbParam?: IDatabase<any, any>
): Promise <void> => {
    db = db ? db : dbParam ? dbParam : initDbConnection(
        process.env.DB_USER as string,
        process.env.DB_PASS as string,
        process.env.DB_URI as string
    );

    await doDelete(event.request_id, db);
};

interface DeleteRequestEvent {
    readonly request_id: string;
}
