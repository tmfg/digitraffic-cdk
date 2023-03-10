import { ApiTimestamp } from "../model/timestamp";
import {
    AwakeAiPrediction,
    AwakeAiPredictionType,
    AwakeAiShipStatus,
    AwakeAiVoyageEtaPrediction,
    AwakeAiZoneType,
    AwakeArrivalPortCallPrediction,
} from "../api/awake_common";
import { AwakeAiETAPortApi, AwakeAiPortSchedule } from "../api/awake_ai_port";
import {
    isDigitrafficEtaPrediction,
    predictionToTimestamp,
} from "./awake_ai_eta_helper";
import { EventSource } from "../model/eventsource";
import { addHours, isBefore, parseISO } from "date-fns";

export class AwakeAiETAPortService {
    private readonly api: AwakeAiETAPortApi;

    constructor(api: AwakeAiETAPortApi) {
        this.api = api;
    }

    private voyageIsUnderWay(schedule: AwakeAiPortSchedule): boolean {
        return schedule.voyage.voyageStatus === AwakeAiShipStatus.UNDER_WAY;
    }

    private portCallExistsForVoyage(schedule: AwakeAiPortSchedule): boolean {
        return schedule.voyage.predictions.some(
            (prediction) =>
                prediction.predictionType ===
                AwakeAiPredictionType.ARRIVAL_PORT_CALL
        );
    }

    private isEtaPrediction(
        prediction: AwakeAiPrediction
    ): prediction is AwakeAiVoyageEtaPrediction {
        return prediction.predictionType === AwakeAiPredictionType.ETA;
    }

    private validateArrivalTime(
        etaPrediction: AwakeAiVoyageEtaPrediction
    ): boolean {
        if (
            isBefore(
                parseISO(etaPrediction.arrivalTime),
                addHours(Date.now(), 24)
            )
        ) {
            console.warn(
                `method=AwakeAiETAPortService.getAwakeAiTimestamps arrival is closer than 24 hours, not persisting ETA: ${JSON.stringify(
                    etaPrediction
                )}`
            );
            return false;
        }
        return true;
    }

    private getEtaPredictions(
        voyagePredictions: AwakeAiPrediction[]
    ): AwakeAiVoyageEtaPrediction[] {
        return (
            voyagePredictions
                .filter(
                    (prediction): prediction is AwakeAiVoyageEtaPrediction =>
                        this.isEtaPrediction(prediction)
                )
                // filter out predictions originating from digitraffic portcall api
                .filter(
                    (etaPrediction) =>
                        !isDigitrafficEtaPrediction(etaPrediction)
                )
                .filter(
                    (etaPrediction) =>
                        etaPrediction.zoneType === AwakeAiZoneType.BERTH
                )
        );
    }

    async getAwakeAiTimestamps(locode: string): Promise<ApiTimestamp[]> {
        const resp = await this.api.getETAs(locode);

        console.info(
            `method=AwakeAiETAPortService.getAwakeAiTimestamps Received ETA response: ${JSON.stringify(
                resp
            )}`
        );

        if (!resp.schedule) {
            console.warn(
                `method=AwakeAiETAPortService.getAwakeAiTimestamps no ETA received, state=${resp.type}`
            );
            return [];
        }

        return (
            resp.schedule
                // only ships under way
                .filter((schedule) => this.voyageIsUnderWay(schedule))
                // only ships with a port call id
                .filter((schedule) => this.portCallExistsForVoyage(schedule))
                .flatMap((schedule) => {
                    const etaPredictions = this.getEtaPredictions(
                        schedule.voyage.predictions
                    );

                    // we can be sure that this exists because of the filter portCallExistsForVoyage
                    const portcallPrediction = schedule.voyage.predictions.find(
                        (p) =>
                            p.predictionType ===
                            AwakeAiPredictionType.ARRIVAL_PORT_CALL
                    ) as AwakeArrivalPortCallPrediction;

                    return etaPredictions.map((eta) => {
                        if (!this.validateArrivalTime(eta)) return null;
                        return predictionToTimestamp(
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
                .filter((ts): ts is ApiTimestamp => ts !== null)
        );
    }
}
