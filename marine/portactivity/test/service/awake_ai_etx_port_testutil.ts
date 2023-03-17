import { AwakeAiPrediction, AwakeAiPredictionType, AwakeAiVoyageStatus } from "../../lib/api/awake_common";
import { AwakeAiPortResponse, AwakeAiPortResponseType } from "../../lib/api/awake_ai_port";
import { randomIMO, randomMMSI } from "../testdata";

export function createAwakeAiPortResponse(
    predictions: AwakeAiPrediction[],
    options?: {
        voyageStatus?: AwakeAiVoyageStatus;
        includePortCallPrediction?: boolean;
        excludeSchedule?: boolean;
    }
): AwakeAiPortResponse {
    return {
        type: AwakeAiPortResponseType.OK,
        ...(!options?.excludeSchedule && {
            schedule: [
                {
                    ship: {
                        imo: randomIMO(),
                        mmsi: randomMMSI()
                    },
                    voyage: {
                        voyageStatus: options?.voyageStatus ?? AwakeAiVoyageStatus.UNDER_WAY,
                        predictions: options?.includePortCallPrediction
                            ? predictions.concat([
                                  {
                                      predictionType: AwakeAiPredictionType.ARRIVAL_PORT_CALL
                                  }
                              ])
                            : predictions,
                        sequenceNo: 1
                    }
                }
            ]
        })
    };
}
