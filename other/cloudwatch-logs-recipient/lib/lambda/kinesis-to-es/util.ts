const nanValue = -1;

export function getIndexName(appName: string, timestampFromEvent: any): string {
    const timestamp = new Date(1 * timestampFromEvent);

    // index name format: app-YYYY.MM
    const timePart = [
        timestamp.getUTCFullYear(),              // year
        ('0' + (timestamp.getUTCMonth() + 1)).slice(-2)  // month
    ].join('.');

    return `${appName}-${timePart}`;
}

export function buildFromMessage(message: string): any {
    if(skipElasticLogging(message)) {
        return {};
    }

    message = message.replace('[, ]', '[0.0,0.0]')
        .replace(/\"Infinity\"/g, "-1")
        .replace(/Infinity/gi, "-1")
        .replace(/\"null\"/gi, "null")
        .replace(/\\n/g, "\\n")
        .replace(/\\'/g, "\\'")
        .replace(/\\"/g, '\\"')
        .replace(/\\&/g, "\\&")
        .replace(/\\r/g, "\\r")
        .replace(/\\t/g, "\\t")
        .replace(/\\b/g, "\\b")
        .replace(/\\f/g, "\\f");

    try {
        const jsonSubString = extractJson(message);
        if (jsonSubString !== null) {
            const parsedJson = JSON.parse(jsonSubString);

            // upstream_response_time can contain value: "0.008 : 0.132" and that cannot be parsed to float in ES -> sum it as single value
            if ( parsedJson.hasOwnProperty('@fields') && parsedJson['@fields'].hasOwnProperty('upstream_response_time') ) {
                parsedJson['@fields'].upstream_response_time = parseUpstreamResponseTime(parsedJson);
            }
            return parsedJson;
        } else {
            return JSON.parse('{"log_line": "' + message.replace(/["']/g, "") + '"}');
        }
    } catch (e) {
        console.info("error " + e);
        console.info("Error converting to json:" + message);
    }

    return {};
}

function parseUpstreamResponseTime(parsedJson: any) {
    if ( parsedJson['@fields'].upstream_response_time ) {
        const sum = parsedJson['@fields'].upstream_response_time.split(":").reduce((prev: any, next: any) => prev + (+next), 0).toFixed(3);
        if (sum && !isNaN(+sum)) {
            return parseFloat(sum);
        }
        return nanValue;
    }
    return nanValue;
}

function skipElasticLogging(message: string): boolean {
    return message.includes("<?xml") || message.startsWith("DEBUG");
}

export function extractJson(message: string): any {
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

export function isNumeric(n: any): boolean {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

export function isInfinity(n: any): boolean {
    return !isNaN(parseFloat(n)) && !isFinite(n);
}

export function getFailedIds(failedItems: any[]): string[] {
    return failedItems.map(f => f.index._id);
}

export function isControlMessage(payload: any): boolean {
    return payload.messageType === 'CONTROL_MESSAGE';
}

export function filterIds(body: string, ids: string[]): string {
   const lines = body.split('\n');
   let newBody = "";

   for(let i = 0;i < lines.length;i+= 2) {
       const indexLine = lines[i];
       const logLine = lines[i+1];

        // ends with newline, so one empty line in the end
       if(indexLine.length > 0 && !containsIds(logLine, ids)) {
           newBody+= indexLine + '\n';
           newBody+= logLine + '\n';
       }
   }

   return newBody;
}

function containsIds(line: string, ids: string[]): boolean {
    for(const id of ids) {
        if(line.indexOf(id) !== -1) {
            return true;
        }
    }

    return false;
}

export function parseESReturnValue(response: any, responseBody: string): any {
    const info = JSON.parse(responseBody);
    let failedItems;
    let success;

    if (response.statusCode >= 200 && response.statusCode < 299) {
        failedItems = info.items.filter(function(x: any) {
            return x.index.status >= 300;
        });

        success = {
            "attemptedItems": info.items.length,
            "successfulItems": info.items.length - failedItems.length,
            "failedItems": failedItems.length
        };
    }

    const error = response.statusCode !== 200 || info.errors === true ? {
        "statusCode": response.statusCode,
        "responseBody": responseBody
    } : null;

    return {
        success: success,
        error: error,
        failedItems: failedItems
    }
}
