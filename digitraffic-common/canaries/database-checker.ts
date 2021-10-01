import {withDbSecret} from "../secrets/dbsecret";
import {inDatabase, inDatabaseReadonly} from "../postgres/database";
import {IDatabase} from "pg-promise";

const synthetics = require('Synthetics');

export type DatabaseCheck = {
    readonly name: string
    readonly sql: string
    readonly minCount?: number
}

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

    async expect(checks: DatabaseCheck[]) {
        if (!checks.length) {
            throw new Error('No checks');
        }
        await withDbSecret(this.secret, async () => {
            await inDatabaseReadonly(async (db: IDatabase<any>) => {
                for (const check of checks) {
                    console.info("canary checking sql " + check.sql);

                    const value = await db.oneOrNone(check.sql);

                    if(!value) {
                        this.errors.push(`Test ${check.name} returned no value`);
                    } else {
                        console.info("return value " + JSON.stringify(value));

                        if(value.count) {
                            if (value.count < (check.minCount || 1)) {
                                this.errors.push(`Test ${check.name} count was ${value.count}, minimum is ${check.minCount}`);
                            }
                        }
                    }
                }
            });
        });
    }

    async expectRows(testName: string, sql: string, minimum = 1): Promise<string> {
        return withDbSecret(this.secret, async () => {
            return inDatabaseReadonly(async (db: IDatabase<any>) => {
                console.info("canary checking sql " + sql);

                const value = await db.oneOrNone(sql);

                if(!value) {
                    this.errors.push(`${testName}:No value!`);
                } else {
                    if(value.count < minimum) {
                        this.errors.push(`${testName}:${value.count} < ${minimum}`);
                    }
                }
            });
        });
    }

    done(): Promise<string> {
        if(this.errors.length === 0) {
            return Promise.resolve("Canary completed succesfully");
        }

        throw Error(this.errors.join('\n'));
    }
}
