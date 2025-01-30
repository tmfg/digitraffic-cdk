import {
  type AwakeAiATXApi,
  type AwakeAIATXTimestampMessage,
  AwakeATXZoneEventType,
} from "../api/awake-ai-atx.js";
import { type ApiTimestamp, EventType } from "../model/timestamp.js";
import * as TimestampDAO from "../dao/timestamps.js";
import {
  type DTDatabase,
  inDatabase,
} from "@digitraffic/common/dist/database/database";
import { EventSource } from "../model/eventsource.js";
import { AwakeAiZoneType } from "../api/awake-common.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { TZDate } from "@date-fns/tz";

export class AwakeAiATXService {
  private readonly api: AwakeAiATXApi;

  constructor(api: AwakeAiATXApi) {
    this.api = api;
  }

  async getATXs(timeoutMillis: number): Promise<ApiTimestamp[]> {
    const atxs = await this.api.getATXs(timeoutMillis);
    return inDatabase((db: DTDatabase) => {
      const promises = atxs
        .filter((atx) => atx.zoneType === AwakeAiZoneType.BERTH)
        .map(async (atx: AwakeAIATXTimestampMessage) => {
          // pick the first supported LOCODE
          if (atx.locodes.length > 1) {
            logger.warn({
              method: "AwakeAiATXService.getATXs",
              message:
                `More than one locode for timestamp! IMO ${atx.imo} locodes ${
                  JSON.stringify(atx.locodes)
                }`,
            });
          } else if (!atx.locodes.length) {
            logger.error({
              method: "AwakeAiATXService.getATXs",
              message: `No locode for timestamp! IMO ${atx.imo}`,
            });
          }
          const port = atx.locodes[0] as unknown as string;
          const eventType = atx.zoneEventType === AwakeATXZoneEventType.ARRIVAL
            ? EventType.ATA
            : EventType.ATD;
          const eventTime = new TZDate(atx.eventTimestamp);

          const portcallId = await TimestampDAO.findPortcallId(
            db,
            port,
            eventType,
            eventTime,
            atx.mmsi,
            atx.imo,
          );

          if (portcallId) {
            return {
              eventType,
              eventTime: atx.eventTimestamp,
              recordTime: atx.eventTimestamp,
              source: EventSource.AWAKE_AI,
              ship: {
                imo: atx.imo,
                mmsi: atx.mmsi,
              },
              location: {
                port,
              },
              portcallId,
            } as ApiTimestamp;
          } else {
            logger.warn({
              method: "AwakeAiATXService.getATXs",
              message:
                `no portcall found for ${atx.zoneEventType} IMO ${atx.imo}`,
            });
            return null;
          }
        });
      return Promise.all(promises).then((timestamps) =>
        timestamps.filter((timestamp) => !!timestamp)
      );
    });
  }
}
