import type { APIGatewayProxyEvent } from "aws-lambda";

/**
 * Parses query parameters from an APIGatewayProxyEvent, allowing certain fields to always be treated as arrays (multiValueQueryStringParameters).
 * As APIGatewayProxyEvent can have both single and multi-value query parameters, this function merges them appropriately mixed in both variables.
 * e.g. multiValueQueryStringParameters contains always values from queryStringParameters.
 * @param event APIGatewayProxyEvent from lambda proxy integration handler
 * @param multiValueQueryParameters fields that are multi-value query parameters
 */
export function parseQueryParams<T extends Record<string, unknown>>(
  event: APIGatewayProxyEvent,
  multiValueQueryParameters: readonly string[] = [],
): T {
  const multi = event.multiValueQueryStringParameters ?? {};
  const single = event.queryStringParameters ?? {};

  const keys = new Set<string>([...Object.keys(single), ...Object.keys(multi)]);

  const result: Record<string, unknown> = {};

  for (const key of keys) {
    const multiVal = multi[key];
    const singleVal = single[key];

    let values: string[];

    if (Array.isArray(multiVal)) {
      values = multiVal;
    } else if (typeof singleVal === "string") {
      values = [singleVal];
    } else {
      continue;
    }

    const forceArray = multiValueQueryParameters.includes(key);

    result[key] = forceArray ? values : values.length > 1 ? values : values[0];
  }

  return result as T;
}
