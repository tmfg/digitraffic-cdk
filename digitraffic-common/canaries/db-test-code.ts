import {withDbSecret} from "../secrets/dbsecret";
import {inDatabase} from "../postgres/database";
import {IDatabase} from "pg-promise";

export class DbTestCode {
    readonly secret: string;

    constructor(secret: string) {
        this.secret = secret;
    }

    async test(sql: string): Promise<string> {
        return withDbSecret(this.secret, async () => {
            return inDatabase(async (db: IDatabase<any>) => {
                console.info("canary checking sql " + sql);

                const value = await db.oneOrNone(sql);

                console.info("return value " + JSON.stringify(value));

                return "Canary completed succesfully";
            });
        });
    }
}