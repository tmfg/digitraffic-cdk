import * as zlib from "node:zlib";

/**
 * Encode given string to base64
 * @param str
 * @param encoding
 */
export function encodeBase64(str: string, encoding: BufferEncoding): string {
  return Buffer.from(str, encoding).toString("base64");
}

/**
 * Decode given string from base64 to given encoding
 * @param str
 * @param encoding
 */
export function decodeBase64(str: string, encoding: BufferEncoding): string {
  return Buffer.from(str, "base64").toString(encoding);
}

/**
 * Encode given string from ascii to Base64 string
 * @param token
 */
export function encodeAsciiToBase64(token: string): string {
  return encodeBase64(token, "ascii");
}

/**
 * Decode given string from base64 to ascii
 * @param str string
 */
export function decodeBase64ToAscii(str: string): string {
  return decodeBase64(str, "ascii");
}

/**
 * Encode given string from base64 to utf8 string
 * @param str
 */
export function encodeUtf8ToBase64(str: string): string {
  return encodeBase64(str, "utf8");
}
/**
 * Decode given string from base64 to utf8 string. If compressed is true, decompresses it first.
 * @param str String to decode from base64.
 * @param compressed Whether the input string is compressed (gzip) or not.
 */
export function decodeBase64ToUtf8(str: string, compressed = false): string {
  const buffer = Buffer.from(str, "base64");
  return compressed
    ? zlib.gunzipSync(buffer).toString("utf8")
    : buffer.toString("utf8");
}

export function compressBuffer(buffer: Buffer): Buffer {
  return zlib.gzipSync(buffer);
}
