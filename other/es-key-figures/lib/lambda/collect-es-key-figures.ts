import * as AWSx from "aws-sdk";
import {fetchDataFromEs} from "./es-query";
import axios from 'axios';

const AWS = AWSx as any;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mysql = require('mysql');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const util = require('util');
const filtersToPostToSlack = new Set(['@transport_type:*', '@transport_type:rail', '@transport_type:road', '@transport_type:marine']);
const endpoint = new AWS.Endpoint(process.env.ES_ENDPOINT);
const currentDate = new Date();
const start = new Date(
    currentDate.getFullYear(), currentDate.getMonth() - 1, 1, 0, 0, 0, 0,
);
const end = new Date(
    currentDate.getFullYear(), currentDate.getMonth() - 0, 1, 0, 0, 0, 0,
);
const conn = mysql.createConnection({
    host: process.env.MYSQL_ENDPOINT,
    user: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
});

const query = util.promisify(conn.query).bind(conn);

export interface KeyFigure {
    query: string;
    name: string;
    type: string
}

export interface KeyFigureResult extends KeyFigure {
    value: any;
    filter: string;
}

async function postToSlack(kibanaResults: KeyFigureResult[][]) {
    const slackKibanaResults: Set<KeyFigureResult[]> = new Set();
    for (const kibanaResult of kibanaResults) {
        for (const keyFigureResult of kibanaResult) {
            if (filtersToPostToSlack.has(keyFigureResult.filter)) {
                slackKibanaResults.add(kibanaResult);
            }
        }
    }

    for (const kibanaResult of slackKibanaResults) {
        const options = {
            text: createSlackMessage(kibanaResult),
        };

        await axios.post(process.env.SLACK_WEBHOOK!, JSON.stringify(options));
    }
}

function createSlackMessage(keyFigureResults: KeyFigureResult[]) {
    let slackMessage = `\`${keyFigureResults[0].filter}\` aikavälillä: ${start.toISOString()} - ${end.toISOString()} \`\`\``;
    for (const result of keyFigureResults) {
        if (result.type === 'field_agg' || result.type === 'sub_agg') {
            slackMessage += `\n${result.name}\n`;
            for (const key of Object.keys(result.value)) {
                slackMessage += formatSlackLine(key, numberFormatter(result.value[key], 1));
            }
        } else {
            slackMessage += formatSlackLine(result.name, numberFormatter(result.value, 1));
        }
    }

    slackMessage += "```";

    return slackMessage;
}

function numberFormatter(num: number, digits: number) {
    const si = [
        {value: 1, symbol: ""},
        {value: 1E3, symbol: "k"},
        {value: 1E6, symbol: "M"},
        {value: 1E9, symbol: "G"},
        {value: 1E12, symbol: "T"},
        {value: 1E15, symbol: "P"},
        {value: 1E18, symbol: "E"},
    ];
    const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
    let i;
    for (i = si.length - 1; i > 0; i--) {
        if (num >= si[i].value) {
            break;
        }
    }
    return (num / si[i].value).toFixed(digits).replace(rx, "$1") + si[i].symbol;
}

function formatSlackLine(key: string, value: string): string {
    const truncatedKey = truncate(key, 60);
    const truncatedValue = truncate("" + value, 20);

    return truncatedKey + " ".repeat(80 - truncatedKey.length - truncatedValue.length + 1) + truncatedValue + '\n';
}

function truncate(str: string, n: number): string {
    return (str.length > n) ? str.substr(0, n - 1) + '...' : str;
}

export const handler = async (event: { TRANSPORT_TYPE: string; }): Promise<boolean> => {
    const apiPaths = (await getApiPaths()).filter(s => s.transportType === event.TRANSPORT_TYPE);

    console.info(`ES: ${process.env.ES_ENDPOINT}, MySQL: ${process.env.MYSQL_ENDPOINT},  Range: ${start} -> ${end}, Paths: ${apiPaths.map(s => `${s.transportType}, ${Array.from(s.paths).join(', ')}`)}`);

    const keyFigures = getKeyFigures();

    const kibanaResults = await getKibanaResults(keyFigures, apiPaths);
    await persistToDatabase(kibanaResults);
    await postToSlack(kibanaResults);

    return new Promise((resolve, reject) => resolve(true));
};

async function getKibanaResult(keyFigures: KeyFigure[], start: Date, end: Date, filter: string): Promise<KeyFigureResult[]> {
    const output: KeyFigureResult[] = [];

    for (const keyFigure of keyFigures) {
        const query = keyFigure.query
            .replace('START_TIME', start.toISOString())
            .replace('END_TIME', end.toISOString())
            .replace('@transport_type:*', filter);

        const keyFigureResult: KeyFigureResult = {
            type: keyFigure.type,
            query: query,
            filter: filter,
            name: keyFigure.name,
            value: undefined,
        };

        if (keyFigure.type === 'count') {
            const keyFigureResponse = await fetchDataFromEs(endpoint, query, '_count');
            keyFigureResult.value = keyFigureResponse.count;
        } else if (keyFigure.type === 'agg') {
            const keyFigureResponse = await fetchDataFromEs(endpoint, query, '_search?size=0');
            keyFigureResult.value = keyFigureResponse.aggregations.agg.value;
        } else if (keyFigure.type === 'field_agg') {
            const keyFigureResponse = await fetchDataFromEs(endpoint, query, '_search?size=0');
            const value: { [key: string]: any } = {};
            for (const bucket of keyFigureResponse.aggregations.agg.buckets) {
                value[removeIllegalChars(bucket.key)] = bucket.doc_count;
            }
            keyFigureResult.value = value;
        } else if (keyFigure.type === 'sub_agg') {
            const keyFigureResponse = await fetchDataFromEs(endpoint, query, '_search?size=0');
            const value: { [key: string]: any } = {};
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

async function getKibanaResults(keyFigures: KeyFigure[], apiPaths: { transportType: string; paths: Set<string> }[]): Promise<KeyFigureResult[][]> {
    const kibanaResults = [];

    for (const apiPath of apiPaths) {
        console.info(`Running: ${apiPath.transportType}`);
        kibanaResults.push(await getKibanaResult(keyFigures, start, end, `@transport_type:${apiPath.transportType}`));
    }

    for (const apiPath of apiPaths) {
        for (const path of apiPath.paths) {
            console.info(`Running: ${path}`);
            kibanaResults.push(await getKibanaResult(keyFigures, start, end, `@transport_type:${apiPath.transportType} AND @fields.request_uri:\\"${path}\\"`));
        }
    }

    return kibanaResults;
}

async function persistToDatabase(kibanaResults: KeyFigureResult[][]) {
    try {
        const tables = await query('show tables');

        if (tables.length === 0) {
            await query('CREATE TABLE `key_figures` ( `id` INT UNSIGNED NOT NULL AUTO_INCREMENT, `from` DATE NOT NULL, `to` DATE NOT NULL, `name` VARCHAR(100) NOT NULL,`filter` VARCHAR(1000) NOT NULL, `query` VARCHAR(1000) NOT NULL, `value` JSON NOT NULL, PRIMARY KEY (`id`))');
            await query('CREATE INDEX filter_name_date ON key_figures (`filter`, `name`, `from`, `to`);');
        }

        for (const kibanaResult of kibanaResults) {
            for (const result of kibanaResult) {
                const sqlInsert = `INSERT INTO \`key_figures\` (\`from\`, \`to\`, \`query\`, \`value\`, \`name\`, \`filter\`) VALUES ('${start.toISOString().substr(0, 10)}', '${end.toISOString().substr(0, 10)}', '${result.query}', '${JSON.stringify(result.value)}','${result.name}', '${result.filter}');`;
                await query(sqlInsert);
            }
        }
    } catch (error) {
        console.error('Error persisting: ', error);
        throw error;
    }
}

async function getApiPaths(): Promise<{ transportType: string, paths: Set<string> }[]> {
    const railSwaggerPaths = await getPaths('https://rata.digitraffic.fi/swagger/swagger.json');
    const roadSwaggerPaths = await getPaths('https://tie.digitraffic.fi/swagger/swagger-spec.json');
    const marineSwaggerPaths = await getPaths('https://meri.digitraffic.fi/swagger/swagger-spec.json');

    railSwaggerPaths.add('/api/v2/graphql/');
    railSwaggerPaths.add('/api/v1/trains/history');
    railSwaggerPaths.add('/infra-api/');
    railSwaggerPaths.add('/jeti-api/');
    railSwaggerPaths.add('/history/');
    railSwaggerPaths.add('/vuosisuunnitelmat');

    roadSwaggerPaths.add("/*.JPG");

    return [
        {
            transportType: '*',
            paths: new Set(),
        },
        {
            transportType: 'rail',
            paths: railSwaggerPaths,
        },
        {
            transportType: 'road',
            paths: roadSwaggerPaths,
        },
        {
            transportType: 'marine',
            paths: marineSwaggerPaths,
        },
    ];
}

function getKeyFigures(): KeyFigure[] {
    return [
        {
            'name': 'Http req',
            'query': '{"query":{"bool":{"must":[{"query_string":{"query":"NOT log_line:* AND @transport_type:*","analyze_wildcard":true,"time_zone":"Europe/Helsinki"}}],"filter":[{"range":{"@timestamp":{"gte":"START_TIME","lte":"END_TIME","format":"strict_date_optional_time"}}}]}}}',
            'type': 'count',
        },
        {
            'name': 'Http req 200',
            'query': '{"query":{"bool":{"must":[{"query_string":{"query":"NOT log_line:* AND @transport_type:* AND @fields.status:200","analyze_wildcard":true,"time_zone":"Europe/Helsinki"}}],"filter":[{"range":{"@timestamp":{"gte":"START_TIME","lte":"END_TIME","format":"strict_date_optional_time"}}}]}}}',
            'type': 'count',
        },
        {
            'name': 'Bytes out',
            'query': '{"aggs":{"agg":{"sum":{"field":"@fields.body_bytes_sent"}}},"query":{"bool":{"must":[{"query_string":{"query":"NOT log_line:* AND @transport_type:*","analyze_wildcard":true,"time_zone":"Europe/Helsinki"}}],"filter":[{"range":{"@timestamp":{"gte":"START_TIME","lte":"END_TIME","format":"strict_date_optional_time"}}}]}}}',
            'type': 'agg',
        },
        {
            'name': 'Unique IPs',
            'query': '{"aggs":{"agg":{"cardinality":{"field":"@fields.remote_addr.keyword"}}},"query":{"bool":{"must":[{"query_string":{"query":"NOT log_line:* AND @transport_type:*","analyze_wildcard":true,"time_zone":"Europe/Helsinki"}}],"filter":[{"range":{"@timestamp":{"gte":"START_TIME","lte":"END_TIME","format":"strict_date_optional_time"}}}]}}}',
            'type': 'agg',
        },
        {
            'name': 'Top 10 Referers',
            'query': '{"aggs": { "agg": { "terms": { "field": "@fields.http_referrer.keyword", "order": { "_count": "desc" }, "missing": "__missing__", "size": 10 } } }, "query": { "bool": { "must": [ { "query_string": { "query": "NOT log_line:* AND @transport_type:*", "analyze_wildcard": true, "time_zone": "Europe/Helsinki" } } ], "filter": [ { "range": { "@timestamp": { "gte": "START_TIME", "lte": "END_TIME", "format": "strict_date_optional_time" } } } ] } } }',
            'type': 'field_agg',
        },
        {
            'name': 'Top 10 digitraffic-users',
            'query': '{"aggs": { "agg": { "terms": { "field": "@fields.http_digitraffic_user.keyword", "order": { "_count": "desc" }, "missing": "__missing__", "size": 10} } }, "query": { "bool": { "must": [ { "query_string": { "query": "NOT log_line:* AND @transport_type:*", "analyze_wildcard": true, "time_zone": "Europe/Helsinki" } } ], "filter": [ { "range": { "@timestamp": { "gte": "START_TIME", "lte": "END_TIME", "format": "strict_date_optional_time" } } } ] } } }',
            'type': 'field_agg',
        },
        {
            'name': 'Top 10 digitraffic-users by bytes',
            'query': '{ "aggs": { "agg": { "terms": { "field": "@fields.http_digitraffic_user.keyword", "order": { "agg": "desc" }, "missing": "__missing__", "size": 10 }, "aggs": { "agg": { "sum": { "field": "@fields.body_bytes_sent" } } } } }, "query": { "bool": { "must": [ { "query_string": { "query": "NOT log_line:* AND @transport_type:*", "analyze_wildcard": true, "time_zone": "Europe/Helsinki" } } ], "filter": [ { "range": { "@timestamp": { "gte": "START_TIME", "lte": "END_TIME", "format": "strict_date_optional_time" } } } ] } } }',
            'type': 'sub_agg',
        },
        {
            'name': 'Top 10 User Agents',
            'query': '{"aggs": { "agg": { "terms": { "field": "@fields.http_user_agent.keyword", "order": { "_count": "desc" }, "missing": "__missing__", "size": 10 } } }, "query": { "bool": { "must": [ { "query_string": { "query": "NOT log_line:* AND @transport_type:*", "analyze_wildcard": true, "time_zone": "Europe/Helsinki" } } ], "filter": [ { "range": { "@timestamp": { "gte": "START_TIME", "lte": "END_TIME", "format": "strict_date_optional_time" } } } ] } } }',
            'type': 'field_agg',
        },
        {
            'name': 'Top 10 IPs',
            'query': '{"aggs": { "agg": { "terms": { "field": "@fields.remote_addr.keyword", "size": 10 } } }, "query": { "bool": { "must": [ { "query_string": { "query": "NOT log_line:* AND @transport_type:*", "analyze_wildcard": true, "time_zone": "Europe/Helsinki" } } ], "filter": [ { "range": { "@timestamp": { "gte": "START_TIME", "lte": "END_TIME", "format": "strict_date_optional_time" } } } ] } } }',
            'type': 'field_agg',
        },
    ];
}

export async function getPaths(endpointUrl: string): Promise<Set<string>> {
    const resp = await axios.get(endpointUrl, {headers: {'accept-encoding': 'gzip'}});

    if (resp.status != 200) {
        console.error('Fetching faults failed: ' + resp.statusText);

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
    return bucketKey.split('"').join('').split("'").join('').split("\\").join("");
}
