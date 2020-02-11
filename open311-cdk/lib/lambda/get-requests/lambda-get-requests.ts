import {initDbConnection} from 'digitraffic-lambda-postgres/database';
import {findAll} from "../../service/requests";

export const handler = async (event: {extensions: string}): Promise<any> => {
    const db = initDbConnection(
        process.env.DB_USER as string,
        process.env.DB_PASS as string,
        process.env.DB_URI as string
    );

    const requests = await findAll(/true/.test(event.extensions), db);

    db.$pool.end();

    return requests;
};
