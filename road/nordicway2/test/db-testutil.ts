import {inDatabase} from "../../../common/postgres/database";

import {IDatabase} from "pg-promise";

export function testBase(fn: (arg0: any) => void) {
    return () => {
        beforeAll(async () => {
            process.env.DB_USER = 'road';
            process.env.DB_PASS = 'road';
            process.env.DB_URI = 'localhost:54322/road';

            return inDatabase(async (db: IDatabase<any,any>) => {
                await truncate(db);
            });
        });

        // @ts-ignore
        fn();
    };
}


export async function truncate(db: IDatabase<any, any>): Promise<null> {
    return db.none('DELETE FROM nw2_annotation');
}


