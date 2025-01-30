/**
 * https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-output-format
 *
 * Not fully described, extend if necessary.
 */
export interface ProxyLambdaResponse {
  readonly statusCode: number;
  readonly body: string;
  readonly headers?: Record<string, string>;
  readonly multiValueHeaders?: Record<string, string[]>;
}

/**
 * https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 *
 * Not fully described, extend if necessary.
 */
export interface ProxyLambdaRequest {
  readonly resource: string;
  readonly path: string;
  readonly httpMethod: string;
  readonly headers: Record<string, string>;
  readonly multiValueHeaders: Record<string, string[]>;
  readonly queryStringParameters: Record<string, string>;
  readonly multiValueQueryStringParameters: Record<string, string[]>;
  readonly body?: string;
}
