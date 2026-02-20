import { findTimeTableRows } from "../../dao/time_table_row.js";
import { dbTestBase } from "../db-testutil.js";

describe(
  "TimeTableRowDao",
  dbTestBase(() => {
    test("findTimeTableRows - empty", async () => {
      const result = await findTimeTableRows(10, "2024-06-06");
      expect(result.length).toBe(0);
    });
  }),
);
