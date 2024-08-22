/**
 * Decode given string from base64 to ascii
 * @param str string
 */
export function decodeBase64ToAscii(str: string) {
    return decodeBase64(str, "ascii");
}

/**
 * Decode given string from base64 to given encoding
 * @param str
 * @param encoding
 */
export function decodeBase64(str: string, encoding: BufferEncoding) {
    return Buffer.from(str, "base64").toString(encoding);
}
