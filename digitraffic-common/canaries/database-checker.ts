import {withDbSecret} from "../secrets/dbsecret";
import {inDatabase, inDatabaseReadonly} from "../postgres/database";
import {IDatabase} from "pg-promise";

const synthetics = require('Synthetics');

export type DatabaseCheck = {
    readonly name: string
    readonly sql: string
    readonly minCount?: number
}

const stepConfig = {
    'continueOnStepFailure': true,
    'screenshotOnStepStart': false,
    'screenshotOnStepSuccess': false,
    'screenshotOnStepFailure': false
}

export class DatabaseChecker {
    readonly secret: string;

    constructor(secret: string) {
        this.secret = secret;

        synthetics.getConfiguration()
            .disableRequestMetrics();

        synthetics.getConfiguration()
            .withFailedCanaryMetric(true);
    }

    async expect(checks: DatabaseCheck[]) {
        if (!checks.length) {
            throw 'No checks';
        }

        let hasErrors = false;

        await withDbSecret(this.secret, async () => {
            await inDatabaseReadonly(async (db: IDatabase<any>) => {
                for (const check of checks) {
                    console.info("canary checking sql " + check.sql);

                    const value = await db.oneOrNone(check.sql);

                    synthetics.executeStep(check.name, () => {
                        if (!value) {
                            hasErrors = true;
                            throw 'no return value';
                        } else {
                            if (value.count) {
                                if (value.count < (check.minCount || 1)) {
                                    hasErrors = true;
                                    throw `count was ${value.count}, minimum is ${check.minCount}`;
                                }
                            } else {
                                hasErrors = true;
                                throw 'no count available';
                            }
                        }
                    }, stepConfig);
                }
            });
        });

        if(hasErrors) {
            throw 'Failed';
        }
    }

    async done(): Promise<string> {
        return "Canary succesfull";
    }
}
