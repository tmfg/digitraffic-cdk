import * as AWS from "aws-sdk";
import { fetchDataFromEs } from "./es-query";
import { esQueries } from "../es_queries";
import axios from "axios";
import mysql from "mysql";

const endpoint = new AWS.Endpoint(process.env.ES_ENDPOINT as string);

const currentDate = new Date();
const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1, 0, 0, 0, 0);

const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 0, 1, 0, 0, 0, 0);

const KEY_FIGURES_TABLE_NAME = "key_figures";
const DUPLICATES_TABLE_NAME = "duplicates";

const connection = mysql.createConnection({
    host: process.env.MYSQL_ENDPOINT,
    user: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
});

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

    const pathsToProcess = [...apiPaths[0].paths];
    const middleIndex = Math.ceil(pathsToProcess.length / 2);

    const firstHalf = pathsToProcess.splice(0, middleIndex);
    const secondHalf = pathsToProcess.splice(-middleIndex);

    if (event.PART === 1) {
        apiPaths[0].paths = new Set(firstHalf);
    } else if (event.PART === 2) {
        apiPaths[0].paths = new Set(secondHalf);
    }

    console.info(
        `ES: ${process.env.ES_ENDPOINT}, MySQL: ${
            process.env.MYSQL_ENDPOINT
        },  Range: ${startDate.toISOString()} -> ${endDate.toISOString()}, Paths: ${apiPaths.map(
            (s) => `${s.transportType}, ${Array.from(s.paths).join(", ")}`
        )}`
    );

    const keyFigures = getKeyFigures();

    const kibanaResults = await getKibanaResults(keyFigures, apiPaths, event);
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
            .replace("@transport_type:*", filter);

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
            console.error(`Unknown type: ${keyFigure.type}`);
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
            console.info(`Running: ${apiPath.transportType}`);
            kibanaResults.push(
                getKibanaResult(keyFigures, startDate, endDate, `@transport_type:${apiPath.transportType}`)
            );
        }
    }

    for (const apiPath of apiPaths) {
        for (const path of apiPath.paths) {
            console.info(`Running: ${path}`);
            kibanaResults.push(
                getKibanaResult(
                    keyFigures,
                    startDate,
                    endDate,
                    `@transport_type:${apiPath.transportType} AND @fields.request_uri:\\"${path}\\"`
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
        const existingRowsFromDate = await query(
            "SELECT COUNT(*) AS ? FROM ?? WHERE `from` = ? AND `name` = ? AND `filter` = ?;",
            [resultKey, KEY_FIGURES_TABLE_NAME, isoDate, name, filter]
        );
        return Promise.resolve((existingRowsFromDate as Record<string, unknown>[])[0][resultKey] as number);
    } catch (error: unknown) {
        console.error("Error querying database: ", error);
        throw error;
    }
}

async function insertFigures(kibanaResults: KeyFigureResult[], tableName: string) {
    for (const result of kibanaResults) {
        // prettier-ignore
        await query(`INSERT INTO \`${tableName}\` (\`from\`, \`to\`, \`query\`, \`value\`, \`name\`, \`filter\`)
                         VALUES ('${startDate.toISOString().substring(0, 10)}', '${endDate.toISOString().substring(0, 10)}', '${result.query}',
                                 '${JSON.stringify(result.value)}', '${result.name}', '${result.filter}');`);
    }
}

async function persistToDatabase(kibanaResults: KeyFigureResult[]) {
    const CREATE_KEY_FIGURES_TABLE =
        "CREATE TABLE ?? ( `id` INT UNSIGNED NOT NULL AUTO_INCREMENT, `from` DATE NOT NULL, `to` DATE NOT NULL, `name` VARCHAR(100) NOT NULL,`filter` VARCHAR(1000) NOT NULL, `query` VARCHAR(1000) NOT NULL, `value` JSON NOT NULL, PRIMARY KEY (`id`))";
    const CREATE_KEY_FIGURES_INDEX = "CREATE INDEX filter_name_date ON ?? (`filter`, `name`, `from`, `to`);";

    try {
        const tables = await query("show tables");

        if ((tables as Record<string, unknown>[]).length === 0) {
            await query(CREATE_KEY_FIGURES_TABLE, [KEY_FIGURES_TABLE_NAME]);
            await query(CREATE_KEY_FIGURES_INDEX, [KEY_FIGURES_TABLE_NAME]);
        }

        const startIsoDate = startDate.toISOString().substring(0, 10);
        const existingRows = await getRowAmountWithDateNameFilter(
            startIsoDate,
            kibanaResults[0].name,
            kibanaResults[0].filter
        );

        // save duplicate rows to a separate table if current set of results already exists in database
        if (existingRows > 0) {
            console.info(
                `Found existing result '${kibanaResults[0].name}' where 'from' is '${startIsoDate}' and filter is '${kibanaResults[0].filter}', saving to table ${DUPLICATES_TABLE_NAME}`
            );
            await query("DROP TABLE IF EXISTS ??", [DUPLICATES_TABLE_NAME]);
            await query(CREATE_KEY_FIGURES_TABLE, [DUPLICATES_TABLE_NAME]);
            await query(CREATE_KEY_FIGURES_INDEX, [DUPLICATES_TABLE_NAME]);
            await insertFigures(kibanaResults, DUPLICATES_TABLE_NAME);
        } else {
            await insertFigures(kibanaResults, KEY_FIGURES_TABLE_NAME);
        }
    } catch (error) {
        console.error("Error persisting: ", error);
        throw error;
    }
}

export async function getApiPaths(): Promise<{ transportType: string; paths: Set<string> }[]> {
    const railSwaggerPaths = await getPaths("https://rata.digitraffic.fi/swagger/openapi.json");
    const roadSwaggerPaths = await getPaths("https://tie.digitraffic.fi/swagger/openapi.json");
    const marineSwaggerPaths = await getPaths("https://meri.digitraffic.fi/swagger/openapi.json");

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

export function getKeyFigures(): KeyFigure[] {
    return esQueries.map((entry) => {
        return { ...entry, query: JSON.stringify(entry.query) };
    });
}

export async function getPaths(endpointUrl: string): Promise<Set<string>> {
    const resp = await axios.get(endpointUrl, {
        headers: { "accept-encoding": "gzip" }
    });

    if (resp.status !== 200) {
        console.error("Fetching faults failed: " + resp.statusText);

        return new Set<string>();
    }

    const paths = resp.data.paths;

    const output = new Set<string>();
    for (const pathsKey in paths) {
        const splitResult = pathsKey.split("{");
        output.add(splitResult[0].endsWith("/") ? splitResult[0] : splitResult[0] + "/");
    }

    return output;
}

function removeIllegalChars(bucketKey: string): string {
    return bucketKey.replace(/["'\\]/g, "");
}