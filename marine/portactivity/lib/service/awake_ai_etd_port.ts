import {AwakeAiPortApi} from "../api/awake_ai_port";
import {ApiTimestamp} from "../model/timestamp";
import {AwakeAiZoneType,} from "../api/awake_common";
import {
    etdPredictionToTimestamp,
    isAwakeEtdPrediction,
    isDigitrafficEtdPrediction,
    voyageIsNotStopped,
} from "./awake_ai_eta_etd_helper";
import {EventSource} from "../model/eventsource";
import {isBefore, parseISO} from "date-fns";

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

        console.info(
            `method=AwakeAiETDPortService.getAwakeAiTimestamps Received ETD response: ${JSON.stringify(
                resp
            )}`
        );

        if (!resp.schedule) {
            console.warn(
                `method=AwakeAiETDPortService.getAwakeAiTimestamps no ETD received, state=${resp.type}`
            );
            return [];
        }

        return (
            resp.schedule
                // filter out stopped voyages
                .filter(voyageIsNotStopped)
                .flatMap((schedule) => {
                    const etdPredictions = schedule.voyage.predictions
                        .filter(isAwakeEtdPrediction)
                        .filter(etdPrediction => {
                            if (this.departureTimeInThePast(etdPrediction.departureTime)) {
                                console.warn(`method=AwakeAiETDPortService.getAwakeAiTimestamps ETD prediction event time in the past, IMO: ${schedule.ship.imo}, MMSI: ${schedule.ship.mmsi}, prediction: ${JSON.stringify(etdPrediction)}`);
                                return false
                            }
                            return true
                        })
                        // filter out predictions originating from digitraffic portcall api
                        .filter(
                            (etdPrediction) => {
                                if (isDigitrafficEtdPrediction(etdPrediction)) {
                                    console.warn(`method=AwakeAiETDPortService.getAwakeAiTimestamps received Digitraffic ETD prediction, IMO: ${schedule.ship.imo}, MMSI: ${schedule.ship.mmsi}, prediction: ${JSON.stringify(etdPrediction)}`);
                                    return false;
                                }
                                return true;
                            }
                        )
                        .filter(
                            (etdPrediction) =>
                                etdPrediction.zoneType ===
                                AwakeAiZoneType.BERTH
                        )

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
                .filter((ts): ts is ApiTimestamp => ts !== null)
        );
    }
}
