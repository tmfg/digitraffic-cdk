import { type DocumentationVersion } from "@aws-sdk/client-api-gateway";
import { getLatestVersion } from "../../../lambda/update-api-documentation/lambda-update-api-documentation.js";

describe("update-api-documentation", () => {
  test("getLatestVersion - existing versions", () => {
    // random length array with random versions
    const docVersions: DocumentationVersion[] = Array.from({
      length: Math.ceil(Math.random() * 10),
    }).map(() => ({ version: Math.ceil(Math.random() * 10).toString() }));
    const latest = getLatestVersion(docVersions);
    docVersions.sort(
      (d1: DocumentationVersion, d2: DocumentationVersion) =>
        Number(d2.version) - Number(d1.version),
    );

    expect(latest).toBe(Number(docVersions[0]!.version));
  });

  test("getLatestVersion - no versions", () => {
    // random length array with random versions
    const latest = getLatestVersion([]);

    expect(latest).toBe(0);
  });
});
