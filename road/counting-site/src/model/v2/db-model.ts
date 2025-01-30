import type { DataTable, SiteTable } from "../database.js";
import type { Direction, Granularity, TravelMode } from "./types.js";

export type DbSite = Exclude<SiteTable, "created" | "modified">;
export type DbValues = Exclude<DataTable, "created" | "modified">;

export interface DbCsvData {
  readonly name: string;
  readonly travel_mode: TravelMode;
  readonly direction: Direction;
  readonly granularity: Granularity;
  readonly data_timestamp: Date;
  readonly counts: number;
}
