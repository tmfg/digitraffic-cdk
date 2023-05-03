export type DefaultField = "@log_group" | "@log_stream" | "env";

// prettier-ignore
export type DefaultJavaField =  "@timestamp" | "app" | "level" | "log_line" | "logger_name" | "message" | "thread_name";

// prettier-ignore
export type AppField = "message" | "loggerType" | "messageType" | "messages" | "meterName" | "statisticValue";

// prettier-ignore
export type NginxField = "@timestamp";

// prettier-ignore
export type CloudfrontField = "@timestamp" | "env" | "clientCountryCode" | "edgeDetailedResultType" | "edgeLocation" | "edgeResultType" | "httpMethod" | "httpStatusCode" | "request" | "subdomain" | "timeToFirstByte"

export type OSLogField = DefaultField | DefaultJavaField | AppField | NginxField | CloudfrontField;
