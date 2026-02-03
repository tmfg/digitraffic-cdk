import {
  compressBuffer,
  decodeBase64ToAscii,
  decodeBase64ToUtf8,
  encodeAsciiToBase64,
  encodeUtf8ToBase64,
} from "../../utils/base64.js";

describe("Base64UtilTest", () => {
  const EXPECTED_ASCII = "0a9f4967-faaa-445a-ba11-078f7f9556b4";
  const EXPECTED_ASCII_BASE64 =
    "MGE5ZjQ5NjctZmFhYS00NDVhLWJhMTEtMDc4ZjdmOTU1NmI0";

  const EXPECTED_UTF8 = '욤頶ɠ_񝝉T񶅶𞜫7郣Ҧ㒢,"鏤ځ峡蟅͆뼐񭫟ؐԓ外󦸴ԉȺꥅ_񟵭';
  const EXPECTED_UTF8_BASE64 =
    "7Jqk6aC2yaBf8Z2diVTxtoW28J6cqzfug6Ppg6PSpuOSou6Usywi6Y+k2oHls6Hon4XNhuu8kPGtq5/YkNST5aSW86a4tNSJyLrqpYVf8Z+1rQ==";

  test("encode and decode ascii", () => {
    const encodedAscii = encodeAsciiToBase64(EXPECTED_ASCII);
    const decodedAscii = decodeBase64ToAscii(EXPECTED_ASCII_BASE64);
    // encoding/decoding ascii with utf8 should be the same as ascii
    const encodedUtf8 = encodeUtf8ToBase64(EXPECTED_ASCII);
    const decodedUtf8 = decodeBase64ToUtf8(EXPECTED_ASCII_BASE64);
    expect(encodedAscii).toEqual(EXPECTED_ASCII_BASE64);
    expect(decodedAscii).toEqual(EXPECTED_ASCII);
    expect(encodedUtf8).toEqual(EXPECTED_ASCII_BASE64);
    expect(decodedUtf8).toEqual(EXPECTED_ASCII);
    expect(encodedUtf8).toEqual(encodedAscii);
    expect(decodedUtf8).toEqual(decodedAscii);
  });

  test("encode and decode utf8", () => {
    const encodedUtf8 = encodeUtf8ToBase64(EXPECTED_UTF8);
    const decodedUtf8 = decodeBase64ToUtf8(EXPECTED_UTF8_BASE64);
    expect(encodedUtf8).toEqual(EXPECTED_UTF8_BASE64);
    expect(decodedUtf8).toEqual(EXPECTED_UTF8);
  });

  test("decode utf8 compressed", () => {
    const originalBody = { message: EXPECTED_UTF8 };
    const body = JSON.stringify(originalBody);
    const rawBuffer = Buffer.from(body, "utf8");
    const compressed = compressBuffer(rawBuffer);
    const compressedBase64 = compressed.toString("base64");

    const uncompressedBody = decodeBase64ToUtf8(compressedBase64, true);
    const restoredBody = JSON.parse(uncompressedBody);

    expect(originalBody).toEqual(restoredBody);
  });
});
