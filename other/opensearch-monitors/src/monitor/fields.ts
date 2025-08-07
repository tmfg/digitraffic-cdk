export type DefaultField = "@log_group" | "@log_stream" | "env" | "accountName";

// prettier-ignore
export type DefaultJavaField =
  | "@timestamp"
  | "app"
  | "level"
  | "log_line"
  | "logger_name"
  | "message"
  | "thread_name"
  | "type";

export type DefaultLambdaField = "lambdaName" | "method" | "runtime";

// prettier-ignore
export type AppField =
  | "message"
  | "loggerType"
  | "messageType"
  | "messages"
  | "meterName"
  | "statisticValue";

// prettier-ignore
export type NginxField = "@timestamp";

// prettier-ignore
export type CloudfrontField =
  | "@timestamp"
  | "env"
  | "clientCountryCode"
  | "edgeDetailedResultType"
  | "edgeLocation"
  | "edgeResultType"
  | "httpMethod"
  | "httpStatusCode"
  | "request"
  | "request.keyword"
  | "subdomain"
  | "timeToFirstByte"
  | "httpHost";

export type HttpUserAgentField = "@fields.http_user_agent";

// prettier-ignore
export type AlertField =
  | "alert.id"
  | "alert.correlation_id.keyword";

export type OSLogField =
  | DefaultField
  | DefaultJavaField
  | DefaultLambdaField
  | AppField
  | NginxField
  | CloudfrontField
  | HttpUserAgentField
  | AlertField;

export enum Bytes {
  KILO = 1000 * 1000,
  MEGA = KILO * 1000,
  GIGA = MEGA * 1000,
}
