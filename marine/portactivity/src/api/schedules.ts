import * as util from "node:util";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import ky from "ky";
import * as xml2js from "xml2js";

export enum SchedulesDirection {
  EAST = "east",
  WEST = "west",
}

export class SchedulesApi {
  private readonly url: string;

  constructor(url: string) {
    this.url = url;
  }

  async getSchedulesTimestamps(
    direction: SchedulesDirection,
    calculated: boolean,
  ): Promise<SchedulesResponse> {
    const start = Date.now();
    const fullUrl = this.createUrl(direction, calculated);
    logger.info({
      method: "SchedulesApi.getSchedulesTimestamp",
      message: `calling URL ${fullUrl}`,
    });
    const response = await ky.get(fullUrl).text();
    const parse = util.promisify(xml2js.parseString);
    logger.info({
      method: "SchedulesApi.getSchedulesTimestamp",
      tookMs: Date.now() - start,
    });
    return (await parse(response)) as SchedulesResponse;
  }

  private createUrl(
    direction: SchedulesDirection,
    calculated: boolean,
  ): string {
    return `${this.url}/${direction}${calculated ? "/calculated" : ""}`;
  }
}

// xmljs creates arrays of most child elements since in XML we can't be sure of the amount

export interface Timestamp {
  readonly $: {
    readonly time: string;
    readonly uts: string;
  };
}

export interface Destination {
  readonly $: {
    readonly destination?: string;
    readonly locode: string;
    readonly portfacility?: string;
  };
}

export interface Vessel {
  readonly $: {
    readonly vesselName: string;
    readonly callsign: string;
    readonly mmsi: string;
    readonly imo: string;
  };
}

export interface ScheduleTimetable {
  readonly destination?: Destination[];
  readonly eta?: Timestamp[];
  readonly etd?: Timestamp[];
}

export interface Schedule {
  readonly $: {
    readonly UUID: string;
  };
  readonly vessel: Vessel[];
  readonly timetable: ScheduleTimetable[];
}

export interface SchedulesResponse {
  readonly schedules: {
    readonly schedule: Schedule[];
  };
}
