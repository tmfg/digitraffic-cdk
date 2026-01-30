import type { AwsCredentialIdentity } from "@aws-sdk/types";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import type { OpenApiSchema } from "@digitraffic/common/dist/types/openapi-schema";
import { openapiSchema } from "@digitraffic/common/dist/types/openapi-schema";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import type { AssumeRoleRequest } from "aws-sdk/clients/sts.js";
import STS from "aws-sdk/clients/sts.js";
import ky, { HTTPError } from "ky";
import { OpenSearch, OpenSearchApiMethod } from "../api/opensearch.js";
import type { TransportType } from "../constants.js";
import { DB_TRANSPORT_TYPE_FIELD, transportType } from "../constants.js";
import { EnvKeys } from "../env.js";
import type { DbFilter, OsFilter } from "../filter-types.js";
import { osQueries } from "../os-queries.js";
import { query } from "../util/db.js";
import {
  getAccountNameOsFilterFromTransportTypeName,
  getUriFiltersFromPath,
} from "../util/filter.js";

const ROLE_ARN = getEnvVariable(EnvKeys.ROLE);
const OS_HOST = getEnvVariable(EnvKeys.OS_HOST);
const OS_VPC_ENDPOINT = getEnvVariable(EnvKeys.OS_VPC_ENDPOINT);
const OS_INDEX = getEnvVariable(EnvKeys.OS_INDEX);

const currentDate = new Date();
const startDate = new Date(
  currentDate.getFullYear(),
  currentDate.getMonth() - 1,
  1,
  0,
  0,
  0,
  0,
);

const endDate = new Date(
  currentDate.getFullYear(),
  currentDate.getMonth() - 0,
  1,
  0,
  0,
  0,
  0,
);

const KEY_FIGURES_TABLE_NAME = "key_figures";
const DUPLICATES_TABLE_NAME = "duplicates";

export interface KeyFigure {
  query: string;
  name: string;
  type: string;
}

export interface KeyFigureResult extends KeyFigure {
  value: unknown;
  filter: KeyFigureFilter;
}

interface KeyFigureFilter {
  dbFilter: DbFilter;
  osFilter: OsFilter;
}

export interface KeyFigureLambdaEvent {
  readonly TRANSPORT_TYPE: TransportType;
}

const sts = new STS({ apiVersion: "2011-06-15" });

async function assumeRole(roleArn: string): Promise<AwsCredentialIdentity> {
  const roleToAssume = {
    RoleArn: roleArn,
    RoleSessionName: "OS_Session",
    DurationSeconds: 900,
  } as AssumeRoleRequest;

  return await new Promise((resolve, reject) => {
    sts.assumeRole(roleToAssume, (err, data) => {
      if (err || !data?.Credentials) {
        reject(err);
      } else {
        resolve({
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          accessKeyId: data.Credentials.AccessKeyId!,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          secretAccessKey: data.Credentials.SecretAccessKey!,
          sessionToken: data.Credentials.SessionToken,
        });
      }
    });
  });
}

export const handler = async (
  event: KeyFigureLambdaEvent,
): Promise<boolean> => {
  const credentials = await assumeRole(ROLE_ARN);
  const openSearchApi = new OpenSearch(OS_HOST, OS_VPC_ENDPOINT, credentials);

  const apiPaths = (await getApiPaths()).filter(
    (s) => s.transportType === event.TRANSPORT_TYPE,
  );
  const firstPath = apiPaths[0];

  if (!firstPath) {
    logger.error({
      method: "collect-os-key-figures.handler",
      message: "No API paths found in Lambda event",
    });
    throw new Error("No API paths found in Lambda event");
  }

  logger.info({
    message: `OS: ${OS_HOST},  Range: ${startDate.toISOString()} -> ${endDate.toISOString()}, Paths: ${apiPaths
      .map((s) => `${s.transportType}, ${Array.from(s.paths).join(", ")}`)
      .join(",")}`,
    method: "collect-os-key-figures.handler",
  });

  const keyFigureQueries = getKeyFigureOsQueries();

  const osResults = await getOsResults(
    openSearchApi,
    keyFigureQueries,
    apiPaths,
  );
  await persistToDatabase(osResults);

  return Promise.resolve(true);
};

async function getOsResult(
  openSearchApi: OpenSearch,
  keyFigures: KeyFigure[],
  start: Date,
  end: Date,
  filter: KeyFigureFilter,
): Promise<KeyFigureResult[]> {
  const output: KeyFigureResult[] = [];

  logger.debug("Querying with filters: " + JSON.stringify(filter));

  for (const keyFigure of keyFigures) {
    const query = keyFigure.query
      .replace("START_TIME", start.toISOString())
      .replace("END_TIME", end.toISOString())
      .replace("accountName.keyword:*", filter.osFilter);

    const keyFigureResult: KeyFigureResult = {
      type: keyFigure.type,
      query: query,
      filter: filter,
      name: keyFigure.name,
      value: undefined,
    };

    if (keyFigure.type === "count") {
      const keyFigureResponse = await openSearchApi.makeOsQuery(
        OS_INDEX,
        OpenSearchApiMethod.COUNT,
        query,
      );
      keyFigureResult.value = keyFigureResponse.count;
    } else if (keyFigure.type === "agg") {
      const keyFigureResponse = await openSearchApi.makeOsQuery(
        OS_INDEX,
        `${OpenSearchApiMethod.SEARCH}`,
        query,
      );
      keyFigureResult.value = keyFigureResponse.aggregations.agg.value;
    } else if (keyFigure.type === "field_agg") {
      const keyFigureResponse = await openSearchApi.makeOsQuery(
        OS_INDEX,
        `${OpenSearchApiMethod.SEARCH}`,
        query,
      );
      const value: { [key: string]: unknown } = {};
      for (const bucket of keyFigureResponse.aggregations.agg.buckets) {
        value[removeIllegalChars(bucket.key)] = bucket.doc_count;
      }
      keyFigureResult.value = value;
    } else if (keyFigure.type === "sub_agg") {
      const keyFigureResponse = await openSearchApi.makeOsQuery(
        OS_INDEX,
        `${OpenSearchApiMethod.SEARCH}`,
        query,
      );
      const value: { [key: string]: unknown } = {};
      for (const bucket of keyFigureResponse.aggregations.agg.buckets) {
        value[removeIllegalChars(bucket.key)] = bucket.agg.value;
      }
      keyFigureResult.value = value;
    } else {
      logger.error({
        message: `Unknown type: ${keyFigure.type}`,
        method: "collect-os-key-figures.getOsResult",
      });
    }

    output.push(keyFigureResult);
  }

  return output;
}

export async function getOsResults(
  openSearchApi: OpenSearch,
  keyFigures: KeyFigure[],
  apiPaths: { transportType: TransportType; paths: Set<string> }[],
): Promise<KeyFigureResult[]> {
  const osResults = [];

  for (const apiPath of apiPaths) {
    logger.info({
      message: `Running: ${apiPath.transportType}`,
      method: "collect-os-key-figures.getOsResults",
    });
    try {
      const osFilter = getAccountNameOsFilterFromTransportTypeName(
        apiPath.transportType,
      );
      if (!osFilter) {
        logger.error({
          method: "collect-os-key-figures.getOsResults",
          message: "Could not parse OS search filter from transport type",
        });
        throw new Error("Could not parse OS search filter from transport type");
      }
      osResults.push(
        getOsResult(openSearchApi, keyFigures, startDate, endDate, {
          osFilter: osFilter,
          dbFilter: `@transport_type:${apiPath.transportType}`,
        }),
      );
    } catch (error: unknown) {
      logger.error({
        message:
          "Error getting OS query results: " +
          (error instanceof Error && error.message),
        method: "collect-os-key-figures.getOsResults",
      });
      throw error;
    }
  }

  for (const apiPath of apiPaths) {
    for (const path of apiPath.paths) {
      logger.info({
        message: `Running path: ${path}`,
        method: "collect-os-key-figures.getOsResults",
      });
      osResults.push(
        getOsResult(openSearchApi, keyFigures, startDate, endDate, {
          osFilter: `${getAccountNameOsFilterFromTransportTypeName(
            apiPath.transportType,
          )} AND ${getUriFiltersFromPath(path).osFilter}` as OsFilter,
          dbFilter: `${DB_TRANSPORT_TYPE_FIELD}:${apiPath.transportType} AND ${
            getUriFiltersFromPath(path).dbFilter
          }`,
        }),
      );
    }
  }

  const results = await Promise.all(osResults);
  return results.flat();
}

async function getRowAmountWithDateNameFilter(
  isoDate: string,
  name: string,
  filter: string,
): Promise<number> {
  try {
    const resultKey = "count";
    const existingRowsFromDate = (await query(
      "SELECT COUNT(*) AS ? FROM ?? WHERE `from` = ? AND `name` = ? AND `filter` = ?;",
      [resultKey, KEY_FIGURES_TABLE_NAME, isoDate, name, filter],
    )) as { count: number }[];
    const firstRow = existingRowsFromDate[0];
    if (!firstRow) {
      logger.error({
        method: "collect-os-key-figures.getRowAmountWithDateNameFilter",
        message: "Could not find any rows",
      });
      throw new Error("Could not find any rows");
    }
    return Promise.resolve(firstRow[resultKey]);
  } catch (error: unknown) {
    logger.error({
      message:
        "Error querying database: " + (error instanceof Error && error.message),
      method: "collect-os-key-figures.getRowAmountWithDateNameFilter",
    });
    throw error;
  }
}

async function insertFigures(osResults: KeyFigureResult[], tableName: string) {
  for (const result of osResults) {
    /**
         * Even though the actual filters used in the OS queries is by accountName.keyword:[name] and request:[uri],
           they are converted to @transport_type:[rail|road|marine|*] and @fields.request_uri:[uri] for the database entry.

           This is because originally the queries were filtered by the (now non-existent) fields @transport_type and @fields.request_uri.
           These filter strings were entered verbatim in the db data in a single column called `filter`.
           The values of column `filter` are on the other hand used by other applications which categorize data based on the value of this column.
         */
    // prettier-ignore
    await query(
      `INSERT INTO \`${tableName}\` (\`from\`, \`to\`, \`query\`, \`value\`, \`name\`, \`filter\`)
                         VALUES ('${startDate
                           .toISOString()
                           .substring(
                             0,
                             10,
                           )}', '${endDate.toISOString().substring(0, 10)}', '${result.query}',
                                 '${JSON.stringify(
                                   result.value,
                                 )}', '${result.name}', '${result.filter.dbFilter}');`,
    );
  }
}

async function persistToDatabase(osResults: KeyFigureResult[]) {
  const CREATE_KEY_FIGURES_TABLE =
    "CREATE TABLE ?? ( `id` INT UNSIGNED NOT NULL AUTO_INCREMENT, `from` DATE NOT NULL, `to` DATE NOT NULL, `name` VARCHAR(100) NOT NULL,`filter` VARCHAR(1000) NOT NULL, `query` VARCHAR(1000) NOT NULL, `value` JSON NOT NULL, PRIMARY KEY (`id`))";
  const CREATE_KEY_FIGURES_INDEX =
    "CREATE INDEX filter_name_date ON ?? (`filter`, `name`, `from`, `to`);";

  const osResult = osResults[0];

  if (!osResult) {
    logger.error({
      method: "collect-os-key-figures.persistToDatabase",
      message: "No OS results available",
    });
    throw new Error("No OS results available");
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
      osResult.name,
      osResult.filter.dbFilter,
    );

    // save duplicate rows to a separate table if current set of results already exists in database
    if (existingRows > 0) {
      logger.info({
        message: `Found existing result '${osResult.name}' where 'from' is '${startIsoDate}' and filter is '${osResult.filter}', saving to table ${DUPLICATES_TABLE_NAME}`,
        method: "collect-os-key-figures.persistToDatabase",
      });
      await query("DROP TABLE IF EXISTS ??", [DUPLICATES_TABLE_NAME]);
      await query(CREATE_KEY_FIGURES_TABLE, [DUPLICATES_TABLE_NAME]);
      await insertFigures(osResults, DUPLICATES_TABLE_NAME);
    } else {
      await insertFigures(osResults, KEY_FIGURES_TABLE_NAME);
    }
  } catch (error) {
    logger.error({
      message: `Error persisting: ${error instanceof Error && error.message}`,
      method: "collect-os-key-figures.persistToDatabase",
    });
    throw error;
  }
}

export async function getApiPaths(): Promise<
  { transportType: TransportType; paths: Set<string> }[]
> {
  const railSwaggerPaths = await getPaths(
    "https://rata.digitraffic.fi/swagger/openapi.json",
  );
  const roadSwaggerPaths = await getPaths(
    "https://tie.digitraffic.fi/swagger/openapi.json",
  );
  const marineSwaggerPaths = await getPaths(
    "https://meri.digitraffic.fi/swagger/openapi.json",
  );
  const afirSwaggerPaths = await getPaths(
    "https://afir.digitraffic.fi/swagger/openapi.json",
  );

  railSwaggerPaths.add("/api/v2/graphql/");
  railSwaggerPaths.add("/api/v1/trains/history");
  railSwaggerPaths.add("/infra-api/");
  railSwaggerPaths.add("/jeti-api/");
  railSwaggerPaths.add("/history");
  railSwaggerPaths.add("/vuosisuunnitelmat");

  roadSwaggerPaths.add("/*.JPG");

  return [
    {
      transportType: transportType.ALL,
      paths: new Set(),
    },
    {
      transportType: transportType.RAIL,
      paths: railSwaggerPaths,
    },
    {
      transportType: transportType.ROAD,
      paths: roadSwaggerPaths,
    },
    {
      transportType: transportType.MARINE,
      paths: marineSwaggerPaths,
    },
    {
      transportType: transportType.AFIR,
      paths: afirSwaggerPaths,
    },
  ];
}

export function getKeyFigureOsQueries(): KeyFigure[] {
  return osQueries.map((entry) => {
    return { ...entry, query: JSON.stringify(entry.query) };
  });
}

export async function getPaths(endpointUrl: string): Promise<Set<string>> {
  try {
    const response = await ky
      .get(endpointUrl, {
        retry: {
          limit: 3,
        },
      })
      .json();

    const schema: OpenApiSchema = openapiSchema.parse(response);
    const paths = schema.paths;

    const output = new Set<string>();

    for (const pathsKey in paths) {
      const splitResult = pathsKey.split("{")[0];
      if (!splitResult) {
        logger.error({
          message: `Couldn't split the path`,
          method: "collect-os-key-figures.getPaths",
        });
        throw new Error("Couldn't split the path");
      }
      output.add(splitResult.endsWith("/") ? splitResult : splitResult + "/");
    }
    return output;
  } catch (error) {
    if (error instanceof HTTPError) {
      logger.error({
        message: `Fetching OpenApi description from ${endpointUrl} failed with: ${error.message}`,
        method: "collect-os-key-figures.getPaths",
      });
    }
    throw error;
  }
}

function removeIllegalChars(bucketKey: string): string {
  return bucketKey.replace(/["'\\]/g, "");
}
