import {doDelete} from "../../service/requests";
import {IDatabase} from "pg-promise";

export const handler = async (
    event: DeleteRequestEvent,
    context: any,
    callback: any,
    dbParam?: IDatabase<any, any>
): Promise <void> => {
    await doDelete(event.request_id, dbParam);
};

interface DeleteRequestEvent {
    readonly request_id: string;
}
