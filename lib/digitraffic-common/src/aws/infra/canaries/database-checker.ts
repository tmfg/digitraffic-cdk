import { type DTDatabase, inDatabaseReadonly } from "../../../database/database.js";
import { ProxyHolder } from "../../runtime/secrets/proxy-holder.js";
import { RdsHolder } from "../../runtime/secrets/rds-holder.js";
import { getEnvVariable } from "../../../utils/utils.js";
import type { Countable } from "../../../database/models.js";
import { logger } from "../../runtime/dt-logger-default.js";

import synthetics from "Synthetics";

abstract class DatabaseCheck<T> {
    readonly name: string;
    readonly sql: string;
    failed: boolean;

    protected constructor(name: string, sql: string) {
        this.name = name;
        this.sql = sql;
        this.failed = false;
    }

    abstract check(value: T): void;
}

class CountDatabaseCheck extends DatabaseCheck<Countable> {
    // eslint-disable-next-line @rushstack/no-new-null
    readonly minCount: number | undefined | null;
    // eslint-disable-next-line @rushstack/no-new-null
    readonly maxCount: number | undefined | null;

    constructor(
        name: string,
        sql: string,
        // eslint-disable-next-line @rushstack/no-new-null
        minCount: number | undefined | null,
        // eslint-disable-next-line @rushstack/no-new-null
        maxCount: number | undefined | null,
    ) {
        super(name, sql);

        if (!sql.toLowerCase().includes("select") || !sql.toLowerCase().includes("count")) {
            throw new Error("sql must contain select count(*)");
        }

        if ((minCount === null || minCount === undefined) && (maxCount === null || maxCount === undefined)) {
            throw new Error("no max or min given");
        }

        this.minCount = minCount;
        this.maxCount = maxCount;
    }

    check(value: Countable): void {
        if ("count" in value) {
            if (this.minCount && value.count < this.minCount) {
                this.failed = true;
                throw new Error(`count was ${value.count}, minimum is ${this.minCount}`);
            }
            if (this.maxCount && value.count > this.maxCount) {
                this.failed = true;
                throw new Error(`count was ${value.count}, max is ${this.maxCount}`);
            }
        } else {
            this.failed = true;

            throw new Error("no count available");
        }
    }
}

const stepConfig = {
    continueOnStepFailure: true,
    screenshotOnStepStart: false,
    screenshotOnStepSuccess: false,
    screenshotOnStepFailure: false,
};

/**
 * Checker for sql that checks the count.  Meaning that the
 * sql must be structured as "select count(*) from <table> where <something>".
 */
export class DatabaseCountChecker {
    readonly credentialsFunction: () => Promise<void>;
    readonly checks: DatabaseCheck<Countable>[] = [];

    private constructor(credentialsFunction: () => Promise<void>) {
        this.credentialsFunction = credentialsFunction;
        synthetics.getConfiguration().disableRequestMetrics();
        synthetics.getConfiguration().withFailedCanaryMetric(true);
    }

    static createForProxy(): DatabaseCountChecker {
        return new DatabaseCountChecker(() => new ProxyHolder(getEnvVariable("SECRET_ID")).setCredentials());
    }

    static createForRds(): DatabaseCountChecker {
        return new DatabaseCountChecker(() => new RdsHolder(getEnvVariable("SECRET_ID")).setCredentials());
    }

    /**
     * Expect that the count is 1
     */
    expectOne(name: string, sql: string): DatabaseCountChecker {
        this.checks.push(new CountDatabaseCheck(name, sql, 1, 1));

        return this;
    }

    /**
     * Expect that the count is 0
     */
    expectZero(name: string, sql: string): DatabaseCountChecker {
        this.checks.push(new CountDatabaseCheck(name, sql, null, 0));

        return this;
    }

    /**
     * Expect that the count is 1 or more
     */
    expectOneOrMore(name: string, sql: string): DatabaseCountChecker {
        this.checks.push(new CountDatabaseCheck(name, sql, 1, null));

        return this;
    }

    async expect(): Promise<"OK"> {
        if (!this.checks.length) {
            throw new Error("No checks");
        }

        await this.credentialsFunction();
        await inDatabaseReadonly(async (db: DTDatabase) => {
            for (const check of this.checks) {
                logger.info({
                    method: "DatabaseCountChecker.expect",
                    message: "Running sql: " + check.sql,
                });

                const value = await db.one<Countable>(check.sql);
                const checkFunction = (): void => {
                    check.check(value);
                };

                synthetics.executeStep(check.name, checkFunction, stepConfig);
            }
        });

        if (this.checks.some((check) => check.failed)) {
            throw new Error("Failed");
        }

        return "OK";
    }
}
