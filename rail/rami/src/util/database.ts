import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default.js";
import type { Connection, FieldPacket, OkPacket, ResultSetHeader, RowDataPacket } from "mysql2/promise.js";
import { Pool, createPool } from "mysql2/promise.js";
import { getFromEnvOrSecret } from "./secret.js";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils.js";

interface MysqlOpts {
    host: string;
    user: string;
    password: string;
    database: string;
}

export enum DatabaseEnvironmentKeys {
    DB_USER = "DB_USER",
    DB_PASS = "DB_PASS",
    DB_URI = "DB_URI",
    DB_RO_URI = "DB_RO_URI",
    DB_APPLICATION = "DB_APPLICATION"
}

export type MysqlQueryResponse = [
    RowDataPacket[] | RowDataPacket[][] | OkPacket | OkPacket[] | ResultSetHeader,
    FieldPacket[]
];

const pool = await initMysqlDbConnection();

export async function end(): Promise<void> {
    await pool.end();
}

export async function inTransaction(fn: (conn: Connection) => Promise<void>): Promise<void> {
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    try {
        await fn(conn);
        await conn.commit();
    } catch (error: unknown) {
        logger.error({
            method: `database.${inTransaction.name}`,
            message: "Unexpected error occured during mysql transaction. Rollbacking...",
            error
        });
        await conn.rollback();
    }
    conn.release();
}

export async function inDatabase<T>(fn: (conn: Connection) => Promise<T>): Promise<T> {
    const conn = await pool.getConnection();
    const result = await fn(conn);
    conn.release();
    return result;
}

export async function getOpts(): Promise<MysqlOpts> {
    return {
        host: await getFromEnvOrSecret(DatabaseEnvironmentKeys.DB_URI, getEnvVariable("SECRET_ID")),
        user: await getFromEnvOrSecret(DatabaseEnvironmentKeys.DB_USER, getEnvVariable("SECRET_ID")),
        password: await getFromEnvOrSecret(DatabaseEnvironmentKeys.DB_PASS, getEnvVariable("SECRET_ID")),
        database: await getFromEnvOrSecret(
            DatabaseEnvironmentKeys.DB_APPLICATION,
            getEnvVariable("SECRET_ID")
        )
    };
}

export async function initMysqlDbConnection(): Promise<Pool> {
    const { host, user, password, database }: MysqlOpts = await getOpts();

    return createPool({
        host,
        user,
        password,
        database,
        waitForConnections: true,
        connectionLimit: 10,
        maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
        idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0
    });
}
