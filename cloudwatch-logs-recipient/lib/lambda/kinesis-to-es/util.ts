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
    message = message.replace('[, ]', '[0.0,0.0]')
        .replace(/\"Infinity\"/g, "-1")
        .replace(/Infinity/gi, "-1")
        .replace(/\\n/g, "\\n")
        .replace(/\\'/g, "\\'")
        .replace(/\\"/g, '\\"')
        .replace(/\\&/g, "\\&")
        .replace(/\\r/g, "\\r")
        .replace(/\\t/g, "\\t")
        .replace(/\\b/g, "\\b")
        .replace(/\\f/g, "\\f");

    const jsonSubString = extractJson(message);
    if (jsonSubString !== null) {
        return JSON.parse(jsonSubString);
    } else {
        try {
            return JSON.parse('{"log_line": "' + message.replace(/["']/g, "") + '"}');
        } catch (e) {
            console.info("Error converting to json:" + message);
        }
    }

    return {};
}

export function extractJson(message: string): any {
    const jsonStart = message.indexOf("{");
    if (jsonStart < 0) return null;
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