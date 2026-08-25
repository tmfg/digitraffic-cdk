import { expect, test } from "vitest";
import { removePathParts } from "../../lambda/uri-util.js";

test.each([
  ["impossible", 1, "impossible"],
  ["/path/end", 1, "/end"],
  ["/example/path/end", 2, "/end"],
  ["/example/path/plain.txt", 0, "/example/path/plain.txt"],
  ["/example/path/plain.txt", 1, "/path/plain.txt"],
  ["/example/path/plain.txt", 2, "/plain.txt"],
  ["/example/path/plain.txt", 3, "/plain.txt"],
  ["/example/file.zip", 1, "/file.zip"],
  ["/tmc//certified/file.zip", 1, "/certified/file.zip"],
  ["//example///path/plain.txt", 1, "/path/plain.txt"],
])(
  "path should be stripped",
  async (uri: string, count: number, expected: string) => {
    const parsedUri = removePathParts(uri, count);

    expect(parsedUri).toEqual(expected);
  },
);
