export const CLOUDFRONT_STREAMING_LOG_FIELDS = [
    'timestamp',
    'c-ip',
    'time-to-first-byte',
    'sc-status',
    'sc-bytes',
    'cs-method',
    'cs-protocol',
    'cs-uri-stem',
    'x-edge-location',
    'time-taken',
    'cs-protocol-version',
    'cs-user-agent',
    'cs-referer',
    'x-forwarded-for',
    'x-edge-result-type',
    'cs-accept-encoding',

    // keep headers last!
    'cs-headers',
];

export function findHeaderValue(headerName: string, allHeaders: string): string|null {
    for(const value of allHeaders.split('%0A')) {
       const values = value.split(':');

       if(values[0].toUpperCase() === headerName.toUpperCase()) {
           return unescape(values[1]);
       }
    };

    return null;
}