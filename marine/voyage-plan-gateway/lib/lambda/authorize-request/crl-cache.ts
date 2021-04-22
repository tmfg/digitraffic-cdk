const NodeCache = require('node-cache');

const crlCache = new NodeCache({
    stdTTL: 300 // 5 minutes in seconds
});
const CRL_CACHE_KEY = 'crl';

export function getCrlData(): string | undefined {
    return crlCache.get(CRL_CACHE_KEY)
}

export function setCrlData(crlData: string) {
    crlCache.set(CRL_CACHE_KEY, crlData);
}
