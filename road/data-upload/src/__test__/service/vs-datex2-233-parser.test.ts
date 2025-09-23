import { parseSituations233 } from "../../service/vs-datex2-233-parser.js";
import { TEST_DATEX2, TEST_DATEX2_2 } from "./datex2_233_files.js";

describe("parser-233-tests", () => {
  test("parse_empty", () => {
    const situations = parseSituations233("");

    expect(situations.length).toEqual(0);
  });

  test("parse_1", () => {
    const situations = parseSituations233(TEST_DATEX2);

    expect(situations.length).toEqual(2);
    expect(situations[0]!.id).toEqual("KRM043951");
    expect(situations[1]!.id).toEqual("KRM044051");
  });

  test("parse_2", () => {
    const situations = parseSituations233(TEST_DATEX2_2);

    expect(situations.length).toEqual(2);
    expect(situations[0]!.id).toEqual("KRM01");
    expect(situations[1]!.id).toEqual("KRM02");
  });
});
