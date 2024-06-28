import { IncomingMessage } from "http";
import { CloudWatchLogsDecodedData } from "aws-lambda";

const nanValue = -1;

export function getIndexName(appName: string, timestampFromEvent: number): string {
    const timestamp = new Date(timestampFromEvent);

    // index name format: app-YYYY.MM
    const timePart = [
        timestamp.getUTCFullYear(), // year
        ("0" + (timestamp.getUTCMonth() + 1)).slice(-2) // month
    ].join(".");

    return `${appName}-${timePart}`;
}

export function buildFromMessage(message: string, enableJsonParse: boolean): unknown {
    if (skipElasticLogging(message)) {
        return {};
    }

    const logLine = message
        .replace("[, ]", "[0.0,0.0]")
        .replace(/"Infinity"/gi, "-1")
        .replace(/Infinity/gi, "-1")
        .replace(/"null"/gi, "null");

    try {
        if (enableJsonParse) {
            const parsedJson = parseJson(message);

            if (parsedJson) {
                return parsedJson;
            }
        }

        return {
            // eslint-disable-next-line camelcase
            log_line: logLine
        };
    } catch (e) {
        console.info("error " + e);
        console.error("Error converting to json:" + message);
    }

    return {};
}

function parseJson<T>(message: string): T | null {
    const jsonSubString = extractJson(message);
    if (jsonSubString !== null) {
        const parsedJson = JSON.parse(jsonSubString);

        // upstream_response_time can contain value: "0.008 : 0.132" and that cannot be parsed to float in ES -> sum it as single value
        if ("@fields" in parsedJson && "upstream_response_time" in parsedJson["@fields"]) {
            // eslint-disable-next-line camelcase
            parsedJson["@fields"].upstream_response_time = parseUpstreamResponseTime(parsedJson);
        }

        return parsedJson;
    }

    return null;
}

function parseUpstreamResponseTime(parsedJson: any) {
    if (parsedJson["@fields"].upstream_response_time) {
        const sum = parsedJson["@fields"].upstream_response_time
            .split(":")
            .reduce((prev: any, next: any) => prev + +next, 0)
            .toFixed(3);
        if (sum && !isNaN(+sum)) {
            return parseFloat(sum);
        }
        return nanValue;
    }
    return nanValue;
}

function skipElasticLogging(message: string): boolean {
    return message.includes("<?xml");
}

export function extractJson(message: string): string | null {
    const jsonStart = message.indexOf("{");
    if (jsonStart < 0) {
        return null;
    }

    const jsonSubString = message.substring(jsonStart);
    return isValidJson(jsonSubString) ? jsonSubString : null;
}

export function isValidJson(message: string): boolean {
    try {
        JSON.parse(message);
    } catch (e) {
        return false;
    }
    return true;
}

export function parseNumber(value: string): number | null {
    const numValue = parseFloat(value);

    if (isNumeric(numValue)) {
        return numValue;
    } else if (isInfinity(numValue)) {
        return -1;
    }

    return null;
}

export function isNumeric(num: number): boolean {
    return !isNaN(num) && isFinite(num);
}

export function isInfinity(num: number): boolean {
    return !isNaN(num) && !isFinite(num);
}

export function getFailedIds(failedItems: ItemStatus[]): string[] {
    return failedItems.map((f) => f.index._id);
}

export function isControlMessage(payload: CloudWatchLogsDecodedData): boolean {
    return payload.messageType === "CONTROL_MESSAGE";
}

export function filterIds(body: string, ids: string[]): string {
    const lines = body.split("\n");
    let newBody = "";

    for (let i = 0; i < lines.length; i += 2) {
        const indexLine = lines[i];
        const logLine = lines[i + 1];

        // ends with newline, so one empty line in the end
        if (indexLine.length > 0 && !containsIds(logLine, ids)) {
            newBody += indexLine + "\n";
            newBody += logLine + "\n";
        }
    }

    return newBody;
}

function containsIds(line: string, ids: string[]): boolean {
    for (const id of ids) {
        if (line.includes(id)) {
            return true;
        }
    }

    return false;
}

export interface ItemStatus {
    index: {
        status: number;
        _id: string;
    };
}

export interface ESReturnValue {
    success?: {
        attemptedItems: number;
        successfulItems: number;
        failedItems: number;
    };
    error?: {
        statusCode: number;
        responseBody: string;
    };
    failedItems?: ItemStatus[];
}

interface ESResponse {
    items: ItemStatus[];
    errors: boolean;
}

export function parseESReturnValue(response: IncomingMessage, responseBody: string): ESReturnValue {
    try {
        const info = JSON.parse(responseBody) as unknown as ESResponse;

        let failedItems;
        let success;
        let error;

        const statusCode = response.statusCode ?? -1;

        if (statusCode >= 200 && statusCode < 299) {
            failedItems = info.items.filter(function (x: ItemStatus) {
                return x.index.status >= 300;
            });

            success = {
                attemptedItems: info.items.length,
                successfulItems: info.items.length - failedItems.length,
                failedItems: failedItems.length
            };
        }

        if (statusCode !== 200 || info.errors) {
            error = {
                statusCode: statusCode,
                responseBody: responseBody
            };
        }

        return {
            success: success,
            error: error,
            failedItems: failedItems
        };
    } catch (error) {
        console.log("Could not parse " + responseBody);
        console.log("Error: " + JSON.stringify(error, null, 2));
        return {};
    }
}
