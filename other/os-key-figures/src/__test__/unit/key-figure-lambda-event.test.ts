import { describe, expect, test } from "vitest";
import { Service } from "../../domain/types/service.js";
import { forMonth, lastMonth } from "../../domain/types/time-period.js";
import { KeyFigureLambdaEventSchema } from "../../lambda/collect-os-key-figures.js";

describe("KeyFigureLambdaEventSchema", () => {
  test("uses defaults when only TRANSPORT_TYPE is given", () => {
    expect(KeyFigureLambdaEventSchema.parse({ TRANSPORT_TYPE: "*" })).toEqual({
      TRANSPORT_TYPE: Service.ALL,
      TOTAL_GROUPS: 1,
      MONTH: lastMonth(),
    });
  });

  test("parses all fields", () => {
    expect(
      KeyFigureLambdaEventSchema.parse({
        TRANSPORT_TYPE: "RAIL",
        ENDPOINT_GROUP: 2,
        TOTAL_GROUPS: 2,
        MONTH: "2025-12",
      }),
    ).toEqual({
      TRANSPORT_TYPE: Service.RAIL,
      ENDPOINT_GROUP: 2,
      TOTAL_GROUPS: 2,
      MONTH: forMonth(2025, 12),
    });
  });

  test("December ends at the start of January of the next year", () => {
    const { MONTH } = KeyFigureLambdaEventSchema.parse({
      TRANSPORT_TYPE: "road",
      MONTH: "2025-12",
    });
    expect(MONTH.from).toEqual(new Date(2025, 11, 1));
    expect(MONTH.to).toEqual(new Date(2026, 0, 1));
  });

  test.each(["2026-13", "2026-00", "2026-9", "26-09", "2026/09", ""])(
    "rejects invalid MONTH %j",
    (MONTH) => {
      expect(() =>
        KeyFigureLambdaEventSchema.parse({ TRANSPORT_TYPE: "rail", MONTH }),
      ).toThrow("MONTH must be in format YYYY-MM");
    },
  );

  test.each([
    { TRANSPORT_TYPE: "trains" },
    { TRANSPORT_TYPE: "rail", ENDPOINT_GROUP: 0 },
    { TRANSPORT_TYPE: "rail", TOTAL_GROUPS: 1.5 },
    { TRANSPORT_TYPE: "rail", MONTHS: "2026-09" },
    {},
  ])("rejects invalid event %j", (event) => {
    expect(() => KeyFigureLambdaEventSchema.parse(event)).toThrow();
  });
});
