import type { ApiTimestamp } from "../model/timestamp";
import {
    AwakeAiPredictionType,
    AwakeAiVoyageEtaPrediction,
    AwakeAiZoneType,
    AwakeArrivalPortCallPrediction
} from "../api/awake-common";
import type { AwakeAiPortApi, AwakeAiPortSchedule } from "../api/awake-ai-port";
import {
    etaPredictionToTimestamp,
    isAwakeEtaPrediction,
    isDigitrafficEtaPrediction,
    voyageUnderwayOrNotStarted
} from "./awake-ai-etx-helper";
import { EventSource } from "../model/eventsource";
import { addHours, isBefore, parseISO } from "date-fns";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

export class AwakeAiETAPortService {
    private readonly api: AwakeAiPortApi;

    constructor(api: AwakeAiPortApi) {
        this.api = api;
    }

    private validateArrivalTime(etaPrediction: AwakeAiVoyageEtaPrediction): boolean {
        if (isBefore(parseISO(etaPrediction.arrivalTime), addHours(Date.now(), 24))) {
            logger.warn({
                method: "AwakeAiETAPortService.getAwakeAiTimestamps",
                message: `arrival is closer than 24 hours, not persisting ETA: ${JSON.stringify(
                    etaPrediction
                )}`
            });
            return false;
        }
        return true;
    }

    private getEtaPredictions(schedule: AwakeAiPortSchedule): AwakeAiVoyageEtaPrediction[] {
        return (
            schedule.voyage.predictions
                .filter(isAwakeEtaPrediction)
                // filter out predictions originating from digitraffic portcall api
                .filter((etaPrediction) => {
                    if (isDigitrafficEtaPrediction(etaPrediction)) {
                        logger.warn({
                            method: "AwakeAiETAPortService.getAwakeAiTimestamps",
                            message: `received Digitraffic ETA prediction, IMO: ${schedule.ship.imo}, MMSI: ${
                                schedule.ship.mmsi
                            }, prediction: ${JSON.stringify(etaPrediction)}`
                        });
                        return false;
                    }
                    return true;
                })
                .filter((etaPrediction) => etaPrediction.zoneType === AwakeAiZoneType.BERTH)
        );
    }

    async getAwakeAiTimestamps(locode: string): Promise<ApiTimestamp[]> {
        const resp = await this.api.getETAs(locode);

        logger.info({
            method: "AwakeAiETAPortService.getAwakeAiTimestamps",
            message: `Received ETA response: ${JSON.stringify(resp)}`
        });

        if (!resp.schedule) {
            logger.warn({
                method: "AwakeAiETAPortService.getAwakeAiTimestamps",
                message: `no ETA received, state=${resp.type}`
            });
            return [];
        }

        return (
            resp.schedule
                // filter out stopped voyages
                .filter(voyageUnderwayOrNotStarted)
                .flatMap((schedule) => {
                    const etaPredictions = this.getEtaPredictions(schedule);

                    const portcallPrediction = schedule.voyage.predictions.find(
                        (p) => p.predictionType === AwakeAiPredictionType.ARRIVAL_PORT_CALL
                    ) as AwakeArrivalPortCallPrediction | undefined;

                    return etaPredictions.map((eta) => {
                        if (!this.validateArrivalTime(eta)) return undefined;
                        return etaPredictionToTimestamp(
                            eta,
                            EventSource.AWAKE_AI_PRED,
                            locode,
                            schedule.ship.mmsi,
                            schedule.ship.imo,
                            undefined,
                            undefined,
                            portcallPrediction
                        );
                    });
                })
                .filter((ts): ts is ApiTimestamp => !!ts)
        );
    }
}
