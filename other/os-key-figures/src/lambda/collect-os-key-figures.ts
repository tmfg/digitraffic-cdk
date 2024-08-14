import * as AWS from "aws-sdk";
import { fetchDataFromEs } from "./es-query.js";
import { osQueries } from "../os-queries.js";
import axios, { AxiosError } from "axios";
import mysql from "mysql";
import { HttpError } from "@digitraffic/common/dist/types/http-error";
import { retryRequest } from "@digitraffic/common/dist/utils/retry";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

const ES_ENDPOINT = getEnvVariable("ES_ENDPOINT");
const endpoint = new AWS.Endpoint(ES_ENDPOINT);

const currentDate = new Date();
const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1, 0, 0, 0, 0);

const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 0, 1, 0, 0, 0, 0);

const KEY_FIGURES_TABLE_NAME = "key_figures";
const DUPLICATES_TABLE_NAME = "duplicates";

const MARINE_ACCOUNT_NAME = getEnvVariable("MARINE_ACCOUNT_NAME");
const RAIL_ACCOUNT_NAME = getEnvVariable("RAIL_ACCOUNT_NAME");
const ROAD_ACCOUNT_NAME = getEnvVariable("ROAD_ACCOUNT_NAME");

const mysqlOpts = {
    host: getEnvVariable("MYSQL_ENDPOINT"),
    user: getEnvVariable("MYSQL_USERNAME"),
    password: getEnvVariable("MYSQL_PASSWORD"),
    database: getEnvVariable("MYSQL_DATABASE")
};

const connection = mysql.createConnection(mysqlOpts);

const query = (sql: string, values?: string[]) => {
    return new Promise((resolve, reject) => {
        connection.query(sql, values, (error, rows) => {
            if (error) {
                reject(error);
            } else {
                resolve(rows);
            }
        });
    });
};

export interface KeyFigure {
    query: string;
    name: string;
    type: string;
}

export interface KeyFigureResult extends KeyFigure {
    value: unknown;
    filter: string;
}

export interface KeyFigureLambdaEvent {
    readonly TRANSPORT_TYPE: string;
    readonly PART?: number;
}

export const handler = async (event: KeyFigureLambdaEvent): Promise<boolean> => {
    const apiPaths = (await getApiPaths()).filter((s) => s.transportType === event.TRANSPORT_TYPE);
    const firstPath = apiPaths[0];

    if (!firstPath) {
        throw new Error("No paths found");
    }

    const pathsToProcess = [...firstPath.paths];
    const middleIndex = Math.ceil(pathsToProcess.length / 2);

    const firstHalf = pathsToProcess.splice(0, middleIndex);
    const secondHalf = pathsToProcess.splice(-middleIndex);

    if (event.PART === 1) {
        firstPath.paths = new Set(firstHalf);
    } else if (event.PART === 2) {
        firstPath.paths = new Set(secondHalf);
    }

    logger.info({
        message: `ES: ${ES_ENDPOINT}, MySQL: ${
            mysqlOpts.host
        },  Range: ${startDate.toISOString()} -> ${endDate.toISOString()}, Paths: ${apiPaths
            .map((s) => `${s.transportType}, ${Array.from(s.paths).join(", ")}`)
            .join(",")}`,
        method: "collect-es-key-figures.handler"
    });

    const keyFigureQueries = getKeyFigureOsQueries();

    const kibanaResults = await getKibanaResults(keyFigureQueries, apiPaths, event);
    await persistToDatabase(kibanaResults);

    return Promise.resolve(true);
};

async function getKibanaResult(
    keyFigures: KeyFigure[],
    start: Date,
    end: Date,
    filter: string
): Promise<KeyFigureResult[]> {
    const output: KeyFigureResult[] = [];

    for (const keyFigure of keyFigures) {
        const query = keyFigure.query
            .replace("START_TIME", start.toISOString())
            .replace("END_TIME", end.toISOString())
            .replace("accountName:*", filter);

        const keyFigureResult: KeyFigureResult = {
            type: keyFigure.type,
            query: query,
            filter: filter,
            name: keyFigure.name,
            value: undefined
        };

        if (keyFigure.type === "count") {
            const keyFigureResponse = await fetchDataFromEs(endpoint, query, "_count");
            keyFigureResult.value = keyFigureResponse.count;
        } else if (keyFigure.type === "agg") {
            const keyFigureResponse = await fetchDataFromEs(endpoint, query, "_search?size=0");
            keyFigureResult.value = keyFigureResponse.aggregations.agg.value;
        } else if (keyFigure.type === "field_agg") {
            const keyFigureResponse = await fetchDataFromEs(endpoint, query, "_search?size=0");
            const value: { [key: string]: unknown } = {};
            for (const bucket of keyFigureResponse.aggregations.agg.buckets) {
                value[removeIllegalChars(bucket.key)] = bucket.doc_count;
            }
            keyFigureResult.value = value;
        } else if (keyFigure.type === "sub_agg") {
            const keyFigureResponse = await fetchDataFromEs(endpoint, query, "_search?size=0");
            const value: { [key: string]: unknown } = {};
            for (const bucket of keyFigureResponse.aggregations.agg.buckets) {
                value[removeIllegalChars(bucket.key)] = bucket.agg.value;
            }
            keyFigureResult.value = value;
        } else {
            logger.error({
                message: `Unknown type: ${keyFigure.type}`,
                method: "collect-os-key-figures.getKibanaResult"
            });
        }

        output.push(keyFigureResult);
    }

    return output;
}

export async function getKibanaResults(
    keyFigures: KeyFigure[],
    apiPaths: { transportType: string; paths: Set<string> }[],
    event: KeyFigureLambdaEvent
): Promise<KeyFigureResult[]> {
    const kibanaResults = [];

    if (!event.PART || event.PART === 1) {
        for (const apiPath of apiPaths) {
            logger.info({
                message: `Running: ${apiPath.transportType}`,
                method: "collect-es-key-figures.getKibanaResults"
            });
            kibanaResults.push(
                getKibanaResult(
                    keyFigures,
                    startDate,
                    endDate,
                    `${getAccountNameFilterFromTransportTypeName(apiPath.transportType)}`
                )
            );
        }
    }

    for (const apiPath of apiPaths) {
        for (const path of apiPath.paths) {
            logger.info({
                message: `Running path: ${path}`,
                method: "collect-es-key-figures.getKibanaResults"
            });
            kibanaResults.push(
                getKibanaResult(
                    keyFigures,
                    startDate,
                    endDate,
                    `${getAccountNameFilterFromTransportTypeName(
                        apiPath.transportType
                    )} AND @fields.request_uri:\\"${path}\\"`
                )
            );
        }
    }

    const foo = await Promise.all(kibanaResults);
    return foo.flat();
}

async function getRowAmountWithDateNameFilter(
    isoDate: string,
    name: string,
    filter: string
): Promise<number> {
    try {
        const resultKey = "count";
        const existingRowsFromDate = (await query(
            "SELECT COUNT(*) AS ? FROM ?? WHERE `from` = ? AND `name` = ? AND `filter` = ?;",
            [resultKey, KEY_FIGURES_TABLE_NAME, isoDate, name, filter]
        )) as { count: number }[];
        const firstRow = existingRowsFromDate[0];
        if (!firstRow) {
            throw new Error("Could not find any rows");
        }
        return Promise.resolve(firstRow[resultKey]);
    } catch (error: unknown) {
        logger.error({
            message: "Error querying database: " + (error instanceof Error && error.message),
            method: "collect-es-key-figures.getRowAmountWithDateNameFilter"
        });
        throw error;
    }
}

async function insertFigures(kibanaResults: KeyFigureResult[], tableName: string) {
    for (const result of kibanaResults) {
        // prettier-ignore
        await query(`INSERT INTO \`${tableName}\` (\`from\`, \`to\`, \`query\`, \`value\`, \`name\`, \`filter\`)
                         VALUES ('${startDate.toISOString().substring(0, 10)}', '${endDate.toISOString().substring(0, 10)}', '${result.query}',
                                 '${JSON.stringify(result.value)}', '${result.name}', '${getTransportTypeFilterFromAccountNameFilter(result.filter)}');`);
    }
}

function getTransportTypeFilterFromAccountNameFilter(filter: string): string | undefined {
    if (
        filter.includes(RAIL_ACCOUNT_NAME) &&
        filter.includes(ROAD_ACCOUNT_NAME) &&
        filter.includes(MARINE_ACCOUNT_NAME)
    ) {
        return "@transport_type:*";
    } else if (filter.includes(MARINE_ACCOUNT_NAME)) {
        return "@transport_type:marine";
    } else if (filter.includes(RAIL_ACCOUNT_NAME)) {
        return "@transport_type:rail";
    } else if (filter.includes(ROAD_ACCOUNT_NAME)) {
        return "@transport_type:road";
    } else return undefined;
}

function getAccountNameFilterFromTransportTypeName(transportTypeName: string): string | undefined {
    if (transportTypeName.trim() === "*") {
        return `(accountName:${RAIL_ACCOUNT_NAME} OR accountName:${ROAD_ACCOUNT_NAME} OR accountName:${MARINE_ACCOUNT_NAME})`;
    } else if (transportTypeName.trim() === "marine") {
        return `accountName:${MARINE_ACCOUNT_NAME}`;
    } else if (transportTypeName.trim() === "rail") {
        return `accountName:${RAIL_ACCOUNT_NAME}`;
    } else if (transportTypeName.trim() === "road") {
        return `accountName:${ROAD_ACCOUNT_NAME}`;
    } else return undefined;
}

async function persistToDatabase(kibanaResults: KeyFigureResult[]) {
    const CREATE_KEY_FIGURES_TABLE =
        "CREATE TABLE ?? ( `id` INT UNSIGNED NOT NULL AUTO_INCREMENT, `from` DATE NOT NULL, `to` DATE NOT NULL, `name` VARCHAR(100) NOT NULL,`filter` VARCHAR(1000) NOT NULL, `query` VARCHAR(1000) NOT NULL, `value` JSON NOT NULL, PRIMARY KEY (`id`))";
    const CREATE_KEY_FIGURES_INDEX = "CREATE INDEX filter_name_date ON ?? (`filter`, `name`, `from`, `to`);";

    const kibanaResult = kibanaResults[0];

    if (!kibanaResult) {
        throw new Error("No kibana results available");
    }

    try {
        const tables = await query("show tables");

        if ((tables as Record<string, unknown>[]).length === 0) {
            await query(CREATE_KEY_FIGURES_TABLE, [KEY_FIGURES_TABLE_NAME]);
            await query(CREATE_KEY_FIGURES_INDEX, [KEY_FIGURES_TABLE_NAME]);
        }

        const startIsoDate = startDate.toISOString().substring(0, 10);
        const existingRows = await getRowAmountWithDateNameFilter(
            startIsoDate,
            kibanaResult.name,
            kibanaResult.filter
        );

        // save duplicate rows to a separate table if current set of results already exists in database
        if (existingRows > 0) {
            logger.info({
                message: `Found existing result '${kibanaResult.name}' where 'from' is '${startIsoDate}' and filter is '${kibanaResult.filter}', saving to table ${DUPLICATES_TABLE_NAME}`,
                method: "collect-es-key-figures.persistToDatabase"
            });
            await query("DROP TABLE IF EXISTS ??", [DUPLICATES_TABLE_NAME]);
            await query(CREATE_KEY_FIGURES_TABLE, [DUPLICATES_TABLE_NAME]);
            await query(CREATE_KEY_FIGURES_INDEX, [DUPLICATES_TABLE_NAME]);
            await insertFigures(kibanaResults, DUPLICATES_TABLE_NAME);
        } else {
            await insertFigures(kibanaResults, KEY_FIGURES_TABLE_NAME);
        }
    } catch (error) {
        logger.error({
            message: `Error persisting: ${error instanceof Error && error.message}`,
            method: "collect-es-key-figures.persistToDatabase"
        });
        throw error;
    }
}

export async function getApiPaths(): Promise<{ transportType: string; paths: Set<string> }[]> {
    const railSwaggerPaths = await retryRequest(getPaths, "https://rata.digitraffic.fi/swagger/openapi.json");
    const roadSwaggerPaths = await retryRequest(getPaths, "https://tie.digitraffic.fi/swagger/openapi.json");
    const marineSwaggerPaths = await retryRequest(
        getPaths,
        "https://meri.digitraffic.fi/swagger/openapi.json"
    );

    railSwaggerPaths.add("/api/v2/graphql/");
    railSwaggerPaths.add("/api/v1/trains/history");
    railSwaggerPaths.add("/infra-api/");
    railSwaggerPaths.add("/jeti-api/");
    railSwaggerPaths.add("/history/");
    railSwaggerPaths.add("/vuosisuunnitelmat");

    roadSwaggerPaths.add("/*.JPG");

    return [
        {
            transportType: "*",
            paths: new Set()
        },
        {
            transportType: "rail",
            paths: railSwaggerPaths
        },
        {
            transportType: "road",
            paths: roadSwaggerPaths
        },
        {
            transportType: "marine",
            paths: marineSwaggerPaths
        }
    ];
}

export function getKeyFigureOsQueries(): KeyFigure[] {
    return osQueries.map((entry) => {
        return { ...entry, query: JSON.stringify(entry.query) };
    });
}

export async function getPaths(endpointUrl: string): Promise<Set<string>> {
    try {
        const resp = await axios.get<{ paths: { [path: string]: unknown } }>(endpointUrl, {
            headers: { "accept-encoding": "gzip" }
        });
        if (resp.status !== 200) {
            logger.error({
                message: "Fetching faults failed: " + resp.statusText,
                method: "collect-es-key-figures.getPaths"
            });

            return new Set<string>();
        }

        const paths = resp.data.paths;

        const output = new Set<string>();
        // eslint-disable-next-line guard-for-in
        for (const pathsKey in paths) {
            const splitResult = pathsKey.split("{")[0];
            if (!splitResult) {
                throw new Error("Couldn't split the path");
            }
            output.add(splitResult.endsWith("/") ? splitResult : splitResult + "/");
        }

        return output;
    } catch (error) {
        if (error instanceof AxiosError && error.response.status === 403) {
            throw new HttpError(403, error.message);
        }
        throw error;
    }
}

function removeIllegalChars(bucketKey: string): string {
    return bucketKey.replace(/["'\\]/g, "");
}
