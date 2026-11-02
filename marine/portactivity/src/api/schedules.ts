import * as util from "node:util";
import { createKyHooks } from "@digitraffic/common/dist/aws/runtime/logging/http-interceptors";
import ky from "ky";
import * as xml2js from "xml2js";
import { loggerFactory } from "../logging.js";

export enum SchedulesDirection {
  EAST = "east",
  WEST = "west",
}

export class SchedulesApi {
  private readonly _url: string;

  constructor(url: string) {
    this._url = url;
  }

  async getSchedulesTimestamps(
    direction: SchedulesDirection,
    calculated: boolean,
  ): Promise<SchedulesResponse> {
    const fullUrl = this.createUrl(direction, calculated);
    const httpLogger = loggerFactory.logger(
      fullUrl,
      this.createUrlTemplate(calculated),
    );

    const response = await ky
      .get(fullUrl, {
        hooks: createKyHooks(httpLogger),
      })
      .text();
    const parse = util.promisify(xml2js.parseString);

    return (await parse(response)) as SchedulesResponse;
  }

  private createUrl(
    direction: SchedulesDirection,
    calculated: boolean,
  ): string {
    return `${this._url}/${direction}${calculated ? "/calculated" : ""}`;
  }

  private createUrlTemplate(calculated: boolean): string {
    return `${this._url}/{string}${calculated ? "/calculated" : ""}`;
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
