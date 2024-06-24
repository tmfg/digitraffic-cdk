// try to keep this in same order as in documentation
// https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/real-time-logs.html#understand-real-time-log-config-fields
// order here does not matter, but the fields in log will have the same order as in documentation
export const CLOUDFRONT_STREAMING_LOG_FIELDS = [
    "timestamp",
    "c-ip",
    "time-to-first-byte",
    "sc-status",
    "sc-bytes",
    "cs-method",
    "cs-protocol",
    "cs-uri-stem",
    "x-edge-location",
    "x-edge-request-id",
    "time-taken",
    "cs-protocol-version",
    "cs-user-agent",
    "cs-referer",
    "x-forwarded-for",
    "x-edge-result-type",
    "cs-accept-encoding",
    "cs-headers"
];

export function findHeaderValue(headerName: string, allHeaders: string | undefined): string | null {
    if (allHeaders) {
        for (const value of allHeaders.split("%0A")) {
            const values = value.split(":");

            if (values && values[0] && values[0].toUpperCase() === headerName.toUpperCase() && values[1]) {
                return unescape(values[1]);
            }
        }
    }

    return null;
}
