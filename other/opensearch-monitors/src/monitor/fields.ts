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

export type DefaultLambdaField =
  | "lambdaName"
  | "method"
  | "runtime"
  | "record.status";

// prettier-ignore
export type AppField =
  | "message"
  | "loggerType"
  | "messageType"
  | "messages"
  | "meterName"
  | "statisticValue"
  | "prefix"
  | "count";

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
  | "httpHost"
  | "stack_trace"
  | "dump_log";

export type HttpUserAgentField = "@fields.http_user_agent";

// prettier-ignore
export type AlertField = "alert.id" | "alert.correlation_id.keyword";

// prettier-ignore
export type DefaultPythonField = "filename.keyword" | "funcName.keyword";

export type OSLogField =
  | DefaultField
  | DefaultJavaField
  | DefaultLambdaField
  | DefaultPythonField
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
