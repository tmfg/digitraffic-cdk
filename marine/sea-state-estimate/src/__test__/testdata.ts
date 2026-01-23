import type {
  TheItemsSchema,
  TheSSEReportRootSchema,
} from "../generated/tlsc-sse-reports-schema.d.ts";

export const site1: TheItemsSchema = {
  Site: {
    SiteNumber: 1,
    SiteName: "Site 1",
    SiteType: "FLOATING",
  },
  SSE_Fields: {
    WindWaveDir: 1,
    Trend: "ASCENDING",
    SeaState: "BREEZE",
    Confidence: "GOOD",
    Last_Update: "2021-06-01T12:00:00+03:00",
  },
  Extra_Fields: {
    Coord_Latitude: 59.54507,
    Coord_Longitude: 21.32558,
    Temperature: 25,
    Light_Status: "OFF",
    Heel_Angle: 10.0,
  },
};

export const site2: TheItemsSchema = {
  Site: {
    SiteNumber: 2,
    SiteName: "Site 2",
    SiteType: "FLOATING",
  },
  SSE_Fields: {
    WindWaveDir: 1,
    Trend: "ASCENDING",
    SeaState: "BREEZE",
    Confidence: "GOOD",
    Last_Update: "2021-06-01T12:00:00+03:00",
  },
  Extra_Fields: {
    Coord_Latitude: 59.54507,
    Coord_Longitude: 21.32558,
    Temperature: 25,
    Light_Status: "OFF",
    Heel_Angle: 10.0,
  },
};

export function createSampleData(
  sites: TheItemsSchema[],
): TheSSEReportRootSchema {
  return {
    SSE_Reports: sites,
  };
}
