import * as util from "node:util";
import { logger } from "@digitraffic/common/dist/aws/runtime/logging/dt-logger-default";
import { createLoggingInterceptor } from "@digitraffic/common/dist/aws/runtime/logging/http-interceptors";
import { decodeBase64ToAscii } from "@digitraffic/common/dist/utils/base64";
import { Agent, request } from "undici";
import * as xml2js from "xml2js";
import { loggerFactory } from "../logging.js";

export enum SchedulesDirection {
  EAST = "east",
  WEST = "west",
}

export class SchedulesApi {
  private readonly _url: string;

  private readonly _agent: Agent;

  constructor(url: string, certificateBase64: string) {
    this._url = url;

    if (certificateBase64) {
      const ca = decodeBase64ToAscii(certificateBase64).trim();

      this._agent = new Agent({
        connect: {
          ca,
        },
        pipelining: 3,
      });
    } else {
      this._agent = new Agent({
        pipelining: 3,
      });
    }
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

    const dispatcher = this._agent.compose(
      createLoggingInterceptor(httpLogger),
    );

    const resp = await request(new URL(fullUrl), {
      method: "GET",
      dispatcher,
      signal: AbortSignal.timeout(10_000),
    });

    if (resp.statusCode !== 200) {
      const responseBody = await resp.body.text();
      logger.error({
        method: "SchedulesApi.getSchedulesTimestamps",
        customStatus: resp.statusCode,
        customErrorCount: 1,
        customResponsePreview: responseBody.slice(0, 1000),
      });
      throw new Error(
        `Failed to fetch schedules: ${resp.statusCode} ${responseBody.slice(0, 1000)}`,
      );
    }

    const responseText = await resp.body.text();
    const parse = util.promisify(xml2js.parseString);
    return (await parse(responseText)) as SchedulesResponse;
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
