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
 * Decode given string from base64 to utf8 string
 * @param str
 */
export function decodeBase64ToUtf8(str: string): string {
  return decodeBase64(str, "utf8");
}
