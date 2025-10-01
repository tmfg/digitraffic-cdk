import { parseDatex } from "../../service/vs-datex2-35-parser.js";
import {
  TEST_DATEX2,
  TEST_DATEX2_2,
  TEST_DATEX2_VMSPUBLICATION_1,
  TEST_DATEX2_VMSPUBLICATION_2,
} from "./datex2_35_files.js";

describe("parser-35-tests", () => {
  test("parse_empty", () => {
    expect(() => {
      parseDatex("");
    }).toThrow();
  });

  test("parse situationPublication 1", () => {
    const situations = parseDatex(TEST_DATEX2);

    expect(situations.length).toEqual(2);
    expect(situations[0]!.id).toEqual("KRM021323");
    expect(situations[0]!.type).toEqual("SITUATION");
    expect(situations[0]!.datex2.startsWith("<ns3:situation")).toBeTruthy();
    expect(situations[1]!.id).toEqual("KRM01K001");
  });

  test("parse situationPublication 2", () => {
    const situations = parseDatex(TEST_DATEX2_2);

    expect(situations.length).toEqual(1);
    expect(situations[0]!.id).toEqual("KRM015812");
    expect(situations[0]!.datex2.startsWith("<ns6:situation")).toBeTruthy();
  });

  test("parse vmsPublication 1", () => {
    const situations = parseDatex(TEST_DATEX2_VMSPUBLICATION_1);

    expect(situations.length).toEqual(1);
    expect(situations[0]!.id).toEqual("TIO01V101");
    expect(situations[0]!.type).toEqual("CONTROLLER_STATUS");
    expect(situations[0]!.datex2.startsWith("<ns12:vmsControllerStatus"))
      .toBeTruthy();
  });

  test("parse vmsPublication 2", () => {
    const situations = parseDatex(TEST_DATEX2_VMSPUBLICATION_2);

    // eslint-disable-next-line
    console.info("datex " + situations[0]!.datex2);

    expect(situations.length).toEqual(1);
    expect(situations[0]!.id).toEqual("TIO01V310");
    expect(situations[0]!.type).toEqual("CONTROLLER_STATUS");
    expect(situations[0]!.datex2.startsWith("<ns11:vmsControllerStatus"))
      .toBeTruthy();
  });
});
