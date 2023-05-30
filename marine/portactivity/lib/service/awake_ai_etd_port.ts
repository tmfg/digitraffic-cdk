import { AwakeAiPortApi } from "../api/awake_ai_port";
import { ApiTimestamp } from "../model/timestamp";
import { AwakeAiZoneType } from "../api/awake_common";
import {
    etdPredictionToTimestamp,
    isAwakeEtdPrediction,
    isDigitrafficEtdPrediction,
    voyageUnderwayOrNotStarted
} from "./awake_ai_etx_helper";
import { EventSource } from "../model/eventsource";
import { isBefore, parseISO } from "date-fns";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

export class AwakeAiETDPortService {
    private readonly api: AwakeAiPortApi;

    constructor(api: AwakeAiPortApi) {
        this.api = api;
    }

    private departureTimeInThePast(date: string): boolean {
        return isBefore(parseISO(date), Date.now());
    }

    async getAwakeAiTimestamps(locode: string): Promise<ApiTimestamp[]> {
        const resp = await this.api.getETDs(locode);

        logger.info({
            method: "AwakeAiETDPortService.getAwakeAiTimestamps",
            message: `Received ETD response: ${JSON.stringify(resp)}`
        });

        if (!resp.schedule) {
            logger.warn({
                method: "AwakeAiETDPortService.getAwakeAiTimestamps",
                message: `no ETD received, state=${resp.type}`
            });
            return [];
        }

        return (
            resp.schedule
                // filter out stopped voyages
                .filter(voyageUnderwayOrNotStarted)
                .flatMap((schedule) => {
                    const etdPredictions = schedule.voyage.predictions
                        .filter(isAwakeEtdPrediction)
                        .filter((etdPrediction) => {
                            if (this.departureTimeInThePast(etdPrediction.departureTime)) {
                                logger.warn({
                                    method: "AwakeAiETDPortService.getAwakeAiTimestamps",
                                    message: `ETD prediction event time in the past, IMO: ${
                                        schedule.ship.imo
                                    }, MMSI: ${schedule.ship.mmsi}, prediction: ${JSON.stringify(
                                        etdPrediction
                                    )}`
                                });
                                return false;
                            }
                            return true;
                        })
                        // filter out predictions originating from digitraffic portcall api
                        .filter((etdPrediction) => {
                            if (isDigitrafficEtdPrediction(etdPrediction)) {
                                logger.warn({
                                    method: "AwakeAiETDPortService.getAwakeAiTimestamps",
                                    message: `received Digitraffic ETD prediction, IMO: ${
                                        schedule.ship.imo
                                    }, MMSI: ${schedule.ship.mmsi}, prediction: ${JSON.stringify(
                                        etdPrediction
                                    )}`
                                });
                                return false;
                            }
                            return true;
                        })
                        .filter((etdPrediction) => etdPrediction.zoneType === AwakeAiZoneType.BERTH);

                    return etdPredictions.map((etdPrediction) => {
                        return etdPredictionToTimestamp(
                            etdPrediction,
                            EventSource.AWAKE_AI_PRED,
                            locode,
                            schedule.ship.mmsi,
                            schedule.ship.imo,
                            undefined,
                            undefined
                        );
                    });
                })
                .filter((ts): ts is ApiTimestamp => !!ts)
        );
    }
}
