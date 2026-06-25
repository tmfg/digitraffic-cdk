import { describe, expect, test } from "vitest";
import { parseDatex37 } from "../../service/vs-datex2-37-parser.js";
import {
  TEST_DATEX2_37_SITUATION_PUBLICATION_1,
  TEST_DATEX2_37_VMS_PUBLICATION_1,
  TEST_DATEX2_37_VMS_TABLE_PUBLICATION_1,
} from "./datex2_37_files.js";

describe("parser-37-tests", () => {
  test("parse situationPublication", async () => {
    const results = await parseDatex37(TEST_DATEX2_37_SITUATION_PUBLICATION_1);

    expect(results.length).toEqual(1);
    expect(results[0]!.id).toEqual("KRM038851");
    expect(results[0]!.type).toEqual("SITUATION");
    expect(results[0]!.datex2.startsWith("<sit:situation")).toBeTruthy();
  });

  test("parse vmsPublication", async () => {
    const results = await parseDatex37(TEST_DATEX2_37_VMS_PUBLICATION_1);

    expect(results.length).toEqual(1);
    expect(results[0]!.id).toEqual("VME01M304");
    expect(results[0]!.type).toEqual("CONTROLLER_STATUS");
    expect(
      results[0]!.datex2.startsWith("<vms:vmsControllerStatus"),
    ).toBeTruthy();
  });

  test("parse vmsTablePublication", async () => {
    const results = await parseDatex37(TEST_DATEX2_37_VMS_TABLE_PUBLICATION_1);

    expect(results.length).toEqual(187);
    expect(results[0]!.id).toEqual("VME015511");
    expect(results[0]!.type).toEqual("CONTROLLER");
    expect(results[0]!.datex2.startsWith("<vms:vmsController")).toBeTruthy();
  });
});
