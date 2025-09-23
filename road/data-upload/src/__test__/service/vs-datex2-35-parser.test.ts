import { parseSituations35 } from "../../service/vs-datex2-35-parser.js";
import { TEST_DATEX2 } from "./datex2_35_files.js";

describe("parser-35-tests", () => {
  test("parse_empty", () => {
    const situations = parseSituations35("");

    expect(situations.length).toEqual(0);
  });

  test("parse_1", () => {
    const situations = parseSituations35(TEST_DATEX2);

    expect(situations.length).toEqual(20);
    expect(situations[0]!.id).toEqual("KRM021323");
    expect(situations[1]!.id).toEqual("KRM01K001");
  });
});
