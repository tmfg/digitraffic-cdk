export type DefaultField = "@log_group" | "@log_stream" | "env" | "accountName";

// prettier-ignore
export type DefaultJavaField =  "@timestamp" | "app" | "level" | "log_line" | "logger_name" | "message" | "thread_name";

export type DefaultLambdaField = "lambdaName" | "method" | "runtime";

// prettier-ignore
export type AppField = "message" | "loggerType" | "messageType" | "messages" | "meterName" | "statisticValue";

// prettier-ignore
export type NginxField = "@timestamp";

// prettier-ignore
export type CloudfrontField = "@timestamp" | "env" | "clientCountryCode" | "edgeDetailedResultType" | "edgeLocation" | "edgeResultType" | "httpMethod" | "httpStatusCode" | "request" | "subdomain" | "timeToFirstByte"

export type HttpUserAgentField = "@fields.http_user_agent";

export type OSLogField =
    | DefaultField
    | DefaultJavaField
    | DefaultLambdaField
    | AppField
    | NginxField
    | CloudfrontField
    | HttpUserAgentField;
