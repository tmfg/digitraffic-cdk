import type { Connection } from "mysql2/promise";
import { inTransaction } from "../../util/database.js";
import { deleteOldMessages, deleteOldValues } from "../../dao/stop_monitoring.js";

export const handler = async (): Promise<void> => {
    await inTransaction(async (conn: Connection): Promise<void> => {
        await deleteOldValues(conn);
        await deleteOldMessages(conn);
    });
}
