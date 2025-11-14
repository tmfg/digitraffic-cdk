import { parseISO } from "date-fns";
import * as CommonDateUtils from "../../utils/date-utils.js";

const ISO = "2022-01-02T01:02:03.004Z";

describe("CommonDateUtilsTest", () => {
  test("dateFromIsoString", () => {
    const parsed = CommonDateUtils.dateFromIsoString(ISO);
    expect(parsed.toISOString()).toEqual(ISO);
  });

  test("dateFromIsoString fails", () => {
    expect(() => CommonDateUtils.dateFromIsoString(`${ISO}foobar`)).toThrow();
  });

  test("countDiffMs", () => {
    const start = new Date();
    const end = new Date(start.getTime() + 1234);
    expect(CommonDateUtils.countDiffMs(start, end)).toEqual(1234);
  });

  test("countDiffMs", () => {
    const start = new Date();
    const end = new Date(start.getTime() + 1234 * 1000);
    expect(CommonDateUtils.countDiffInSeconds(start, end)).toEqual(1234);
  });

  test("dateToUTCString - preserves UTC from parsed string", () => {
    const date = parseISO("2023-01-01T00:00Z");
    expect(
      CommonDateUtils.dateToUTCString(
        date,
        CommonDateUtils.MYSQL_DATETIME_FORMAT,
      ),
    ).toEqual("2023-01-01 00:00");
  });

  test("dateToUTCString - +02:00 to UTC from parsed string", () => {
    const date = parseISO("2023-01-01T00:00+02:00");
    expect(
      CommonDateUtils.dateToUTCString(
        date,
        CommonDateUtils.MYSQL_DATETIME_FORMAT,
      ),
    ).toEqual("2022-12-31 22:00");
  });
});
