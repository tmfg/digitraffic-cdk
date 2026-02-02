import { parseDatex } from "../../service/vs-datex2-35-parser.js";
import {
  TEST_DATEX2_SITUATION_PUBLICATION,
  TEST_DATEX2_VMS_TABLE_PUBLICATION,
  TEST_DATEX2_VMSPUBLICATION_1,
} from "./datex2_35_files.js";

describe("parser-35-tests", () => {
  /*
  test("parse_empty", () => {
    expect(async () => {
      await parseDatex("");
    }).toThrow();
  });*/

  test("parse situationPublication", async () => {
    const situations = await parseDatex(TEST_DATEX2_SITUATION_PUBLICATION);

    expect(situations.length).toEqual(1);
    expect(situations[0]!.id).toEqual("KRM123456");
    expect(situations[0]!.type).toEqual("SITUATION");
    expect(situations[0]!.datex2.startsWith("<situation")).toBeTruthy();
  });

  test("parse vmsPublication 1", async () => {
    const situations = await parseDatex(TEST_DATEX2_VMSPUBLICATION_1);

    expect(situations.length).toEqual(1);
    expect(situations[0]!.id).toEqual("VME038713");
    expect(situations[0]!.type).toEqual("CONTROLLER_STATUS");
    expect(
      situations[0]!.datex2.startsWith("<vmsControllerStatus"),
    ).toBeTruthy();
  });

  test("parse vmsTablePublication", async () => {
    const situations = await parseDatex(TEST_DATEX2_VMS_TABLE_PUBLICATION);

    expect(situations.length).toEqual(2);
    expect(situations[0]!.id).toEqual("VME/VLK014512");
    expect(situations[0]!.type).toEqual("CONTROLLER");
    expect(situations[0]!.datex2.startsWith("<vmsController")).toBeTruthy();
  });
});
