import { createHmac } from "node:crypto";
import { v4 as uuidv4 } from "uuid";

/**
 * Generates a HMAC authorization header.
 * Uses instructions on https://www.seatrafficmanagement.info/developers-forum/how-to/
 * Document "SMA-HOW-TO-Implement-HMAC-authentication-for-SMA-VIS-and-SPIS-Private-side.pdf"
 * Supports only HTTP GET requests
 *
 * The returned value should be used in the Authorization HTTP header.
 *
 * @param url Request URL
 * @param appId App id
 * @param apiKey API key
 * @return Header value
 */
export function generateHmacAuthorizationHeader(
  url: string,
  appId: string,
  apiKey: string,
): string {
  if (!url) {
    throw new Error("Missing or empty URL");
  }
  if (!appId) {
    throw new Error("Missing or empty app id");
  }
  if (!apiKey) {
    throw new Error("Missing or empty API key");
  }

  const nonce: string = uuidv4().substring(0, 32);
  const encodedUrl = encodeURIComponent(url).toLowerCase();
  const requestTimestamp = Math.trunc(new Date().getTime() / 1000);
  const signatureRaw = `${appId}GET${encodedUrl}${requestTimestamp}${nonce}`;

  const signature = createHmac("sha256", apiKey).update(signatureRaw).digest(
    "base64",
  );

  //    const hash = HmacSHA256(signatureRaw, apiKey);
  //    const signature = hash.toString(CryptoJS.enc.Base64);

  return `amx ${appId}:${signature}:${nonce}:${requestTimestamp}`;
}
