import {withDbSecret} from "../secrets/dbsecret";
import {inDatabase} from "../postgres/database";
import {IDatabase} from "pg-promise";

const synthetics = require('Synthetics');

export class DatabaseChecker {
    readonly secret: string;

    readonly errors: string[];

    constructor(secret: string) {
        this.secret = secret;
        this.errors = [];

        synthetics.getConfiguration()
            .disableRequestMetrics();

        synthetics.getConfiguration()
            .withFailedCanaryMetric(true);
    }

    async expectRows(testName: string, sql: string, minimum = 1): Promise<string> {
        return withDbSecret(this.secret, async () => {
            return inDatabase(async (db: IDatabase<any>) => {
                console.info("canary checking sql " + sql);

                const value = await db.oneOrNone(sql);

                if(!value) {
                    this.errors.push(`Test ${testName} returned no value`);
                } else {
                    console.info("return value " + JSON.stringify(value));

                    if(value.count < minimum) {
                        this.errors.push(`Test ${testName} count was ${value.count}, minimum is ${minimum}`);
                    }
                }
            });
        });
    }

    async resolve(): Promise<any> {
        if(this.errors.length == 0) {
            return Promise.resolve("Canary completed succesfully");
        }

        throw Error(this.errors.join('\n'));
    }
}