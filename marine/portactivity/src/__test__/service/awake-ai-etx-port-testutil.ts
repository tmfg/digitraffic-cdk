import type { AwakeAiPrediction } from "../../api/awake-common.js";
import {
  AwakeAiPredictionType,
  AwakeAiVoyageStatus,
} from "../../api/awake-common.js";
import type { AwakeAiPortResponse } from "../../api/awake-ai-port.js";
import { AwakeAiPortResponseType } from "../../api/awake-ai-port.js";
import { randomIMO, randomMMSI } from "../testdata.js";

export function createAwakeAiPortResponse(
  predictions: AwakeAiPrediction[],
  options?: {
    voyageStatus?: AwakeAiVoyageStatus;
    includePortCallPrediction?: boolean;
    excludeSchedule?: boolean;
  },
): AwakeAiPortResponse {
  return {
    type: AwakeAiPortResponseType.OK,
    ...(!options?.excludeSchedule && {
      schedule: [
        {
          ship: {
            imo: randomIMO(),
            mmsi: randomMMSI(),
          },
          voyage: {
            voyageStatus: options?.voyageStatus ??
              AwakeAiVoyageStatus.UNDER_WAY,
            predictions: options?.includePortCallPrediction
              ? predictions.concat([
                {
                  predictionType: AwakeAiPredictionType.ARRIVAL_PORT_CALL,
                },
              ])
              : predictions,
            sequenceNo: 1,
          },
        },
      ],
    }),
  };
}
