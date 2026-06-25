import { describe, expect, test } from "vitest";
import { createXml, findWithReg, getTags } from "../../service/xml-util.js";

describe("xml-util tests", () => {
  describe("findWithReg", () => {
    test("finds match from start", () => {
      expect(findWithReg("<foo>bar</foo>", /<foo>/)).toBe(0);
    });

    test("finds match with startpos offset", () => {
      const xml = "<foo>one</foo><foo>two</foo>";
      const first = findWithReg(xml, /<foo>/, 0);
      const second = findWithReg(xml, /<foo>/, first + 1);
      expect(first).toBe(0);
      expect(second).toBe(14);
    });

    test("returns -1 when no match", () => {
      expect(findWithReg("<foo>bar</foo>", /<bar>/)).toBe(-1);
    });
  });

  describe("createXml", () => {
    test("wraps object with rootName", () => {
      const result = createXml({ name: "test" }, "myRoot");
      expect(result).toContain("<myRoot>");
      expect(result).toContain("<name>test</name>");
      expect(result).toContain("</myRoot>");
    });

    test("builds headless xml without xml declaration", () => {
      const result = createXml({ a: "1" }, "root");
      expect(result).not.toContain("<?xml");
    });
  });

  describe("getTags", () => {
    test("returns empty array when tag not found", () => {
      const result = getTags("<ns:OtherTag>data</ns:OtherTag>", "MyTag");
      expect(result).toEqual([]);
    });

    test("extracts a single tag", () => {
      const xml = "<ns:Controller id='A1'>data</ns:Controller>";
      const result = getTags(xml, "Controller");
      expect(result).toHaveLength(1);
      expect(result[0]).toContain("data");
    });

    test("extracts multiple tags up to loop limit", () => {
      const xml = [
        "<ns:Item id='1'>one</Item>",
        "<ns:Item id='2'>two</Item>",
        "<ns:Item id='3'>three</Item>",
      ].join("");
      const result = getTags(xml, "Item");
      expect(result).toHaveLength(3);
    });

    test("throws when end tag is missing", () => {
      const xml = "<ns:Controller id='A1'>no end tag here";
      expect(() => getTags(xml, "Controller")).toThrowError(
        "Cannot find end tag!",
      );
    });

    test("handles tag with space after tag name", () => {
      const xml = "<ns:Controller >data</Controller>";
      const result = getTags(xml, "Controller");
      expect(result).toHaveLength(1);
    });
  });
});
