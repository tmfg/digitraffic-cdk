import crypto from "crypto";

/**
 * Creates bigint hash value from given string
 * @param src
 */
export function createHarjaId(src: string): bigint {
    const hex = crypto.createHash("sha256").update(src).digest("hex");
    // Postgres BigInt is 8 byte signed -> take first 7 1/2 bytes to be safe side for unsigned hex value
    return BigInt('0x' + hex.substring(0, 15)).valueOf();
}

export function countEstimatedSizeOfMessage(message: object) {
    try {
        return Buffer.byteLength(JSON.stringify(message)); // Just estimate of the size of new data
    } catch (e) {
        console.error(`method=utils.countEstimatedSizeOfMessage`, e);
    }
    return 0;
}