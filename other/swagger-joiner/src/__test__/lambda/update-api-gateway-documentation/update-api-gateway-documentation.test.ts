import type { DocumentationVersion } from "@aws-sdk/client-api-gateway";
import { describe, expect, test } from "vitest";
import { getNextVersion } from "../../../lambda/update-api-gateway-documentation/lambda-update-api-gateway-documentation.js";

describe("update-api-gateway-documentation", () => {
  test("getNextVersion - numeric versions returns max + 1", () => {
    const docVersions: DocumentationVersion[] = [
      { version: "3" },
      { version: "7" },
      { version: "5" },
    ];
    expect(getNextVersion(docVersions)).toBe("8");
  });

  test("getNextVersion - empty list returns 1", () => {
    expect(getNextVersion([])).toBe("1");
  });

  test("getNextVersion - hash-based versions returns numeric string", () => {
    const docVersions: DocumentationVersion[] = [
      { version: "abc123" },
      { version: "def456" },
    ];
    const result = getNextVersion(docVersions);
    expect(result).toMatch(/^\d+$/);
  });

  test("getNextVersion - mixed versions returns numeric string", () => {
    const docVersions: DocumentationVersion[] = [
      { version: "5" },
      { version: "abc123" },
    ];
    const result = getNextVersion(docVersions);
    expect(result).toMatch(/^\d+$/);
  });
});
