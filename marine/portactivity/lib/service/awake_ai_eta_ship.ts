import {
    AwakeAiETAShipApi,
    AwakeAiShipApiResponse,
    AwakeAiShipPredictability,
    AwakeAiShipVoyageSchedule
} from "../api/awake_ai_ship";
import { DbETAShip } from "../dao/timestamps";
import { ApiTimestamp, EventType } from "../model/timestamp";
import { retry } from "@digitraffic/common/dist/utils/retry";
import { AwakeAiVoyageEtaPrediction, AwakeAiVoyageStatus, AwakeAiZoneType } from "../api/awake_common";
import {
    AwakeDataState,
    etaPredictionToTimestamp,
    isAwakeEtaPrediction,
    isDigitrafficEtaPrediction
} from "./awake_ai_etx_helper";
import { EventSource } from "../model/eventsource";
import { differenceInHours } from "date-fns";
import { Locode } from "../model/locode";

interface AwakeAiETAResponseAndShip {
    readonly response: AwakeAiShipApiResponse;
    readonly ship: DbETAShip;
    readonly diffHours: number;
}

export class AwakeAiETAShipService {
    private readonly api: AwakeAiETAShipApi;

    readonly overriddenDestinations: readonly Locode[] = ["FIHEL", "FIPOR", "FIHKO"];

    readonly publishAsETBDestinations: readonly Locode[] = ["FIRAU"];

    readonly publishAsETPDestinations: readonly Locode[] = ["FIRAU", "FIKOK", "FIKAS", "FIPOR"];

    constructor(api: AwakeAiETAShipApi) {
        this.api = api;
    }

    getAwakeAiTimestamps(ships: DbETAShip[]): Promise<ApiTimestamp[]> {
        return Promise.allSettled(ships.map(this.getAwakeAiTimestamp.bind(this))).then((responses) =>
            responses.reduce<ApiTimestamp[]>((acc, result) => {
                const val = result.status === "fulfilled" ? result.value : undefined;
                if (!val) {
                    return acc;
                }
                console.info(
                    `method=AwakeAiETAShipService.getAwakeAiTimestamps Received ETA response: ${JSON.stringify(
                        val
                    )}`
                );
                const timestamps = this.toTimeStamps(val);

                // temporarily publish ETA also as ETB
                const etbs = timestamps
                    .filter((ts) => this.publishAsETBDestinations.includes(ts.location.port as Locode))
                    .filter((ts) => ts.eventType === EventType.ETA)
                    .map((ts) => ({ ...ts, ...{ eventType: EventType.ETB } }));

                return acc.concat(timestamps, etbs);
            }, [])
        );
    }

    private async getAwakeAiTimestamp(ship: DbETAShip): Promise<AwakeAiETAResponseAndShip> {
        const start = Date.now();

        // if less than 24 hours to ship's arrival, set destination LOCODE explicitly for ETA request
        const diffHours = differenceInHours(ship.eta, Date.now(), { roundingMethod: "floor" });
        const locode = diffHours < 24 ? ship.locode : undefined;

        const response = await retry(() => this.api.getETA(ship.imo, locode), 1);

        console.info(
            `method=AwakeAiETAShipService.getAwakeAiTimestamp fetched ETA for ship with IMO: ${
                ship.imo
            }, LOCODE: ${ship.locode}, portcallid: ${ship.portcall_id}, tookMs=${Date.now() - start}`
        );
        return {
            response,
            ship,
            diffHours
        };
    }

    private toTimeStamps(resp: AwakeAiETAResponseAndShip): ApiTimestamp[] {
        if (!resp.response.schedule) {
            console.warn(
                `method=AwakeAiETAShipService.toTimeStamps no ETA received, state=${resp.response.type}`
            );
            return [];
        }
        return this.handleSchedule(resp.response.schedule, resp.ship, resp.diffHours);
    }

    private handleSchedule(
        schedule: AwakeAiShipVoyageSchedule,
        ship: DbETAShip,
        diffHours: number
    ): ApiTimestamp[] {
        return this.getETAPredictions(schedule)
            .map((etaPrediction) => {
                // use ETA prediction LOCODE by default
                let port: string = etaPrediction.locode;

                if (etaPrediction.locode !== ship.locode) {
                    if (diffHours >= 24) {
                        // 24 hours or more to ship arrival and LOCODE doesn't match, ignore this
                        console.warn(
                            `method=AwakeAiETAShipService.handleSchedule state=${AwakeDataState.DIFFERING_LOCODE} not persisting, IMO: ${ship.imo}, LOCODE: ${ship.locode}, portcallid: ${ship.portcall_id}`
                        );
                        return undefined;
                    } else if (this.overriddenDestinations.includes(ship.locode as Locode)) {
                        // less than 24 hours to ship arrival and port call LOCODE is in list of overridden destinations
                        // don't trust predicted destination, override destination with port call LOCODE
                        console.warn(
                            `method=AwakeAiETAShipService.handleSchedule state=${AwakeDataState.OVERRIDDEN_LOCODE} LOCODE in override list, IMO: ${ship.imo}, LOCODE: ${ship.locode}, portcallid: ${ship.portcall_id}`
                        );
                        port = ship.locode;
                    }
                }

                // allow pilot boarding area ETAs (ETP) only for specific ports
                if (
                    etaPrediction.zoneType === AwakeAiZoneType.PILOT_BOARDING_AREA &&
                    !this.publishAsETPDestinations.includes(port as Locode)
                ) {
                    console.warn(
                        `method=AwakeAiETAShipService.handleSchedule ETP event for non-publishable LOCODE, IMO: ${ship.imo}, LOCODE: ${ship.locode}, portcallid: ${ship.portcall_id}`
                    );
                    return undefined;
                }

                return etaPredictionToTimestamp(
                    etaPrediction,
                    EventSource.AWAKE_AI,
                    ship.locode,
                    schedule.ship.mmsi,
                    ship.imo,
                    ship.port_area_code,
                    ship.portcall_id
                );
            })
            .filter((ts): ts is ApiTimestamp => !!ts);
    }

    private getETAPredictions(schedule: AwakeAiShipVoyageSchedule): AwakeAiVoyageEtaPrediction[] {
        if (schedule.predictability !== AwakeAiShipPredictability.PREDICTABLE) {
            console.warn(
                `method=AwakeAiETAShipService.getETAPredictions state=${
                    AwakeDataState.NO_PREDICTED_ETA
                } voyage was not predictable, schedule ${JSON.stringify(schedule)}`
            );
            return [];
        }

        if (!schedule.predictedVoyages.length) {
            console.warn(
                `method=AwakeAiETAShipService.getETAPredictions state=${
                    AwakeDataState.NO_PREDICTED_ETA
                } predicted voyages was empty, schedule ${JSON.stringify(schedule)}`
            );
            return [];
        }

        // we are only interested in the current voyage (ETA) for now
        const eta = schedule.predictedVoyages[0];

        if (eta.voyageStatus !== AwakeAiVoyageStatus.UNDER_WAY) {
            console.warn(
                `method=AwakeAiETAShipService.getETAPredictions state=${
                    AwakeDataState.SHIP_NOT_UNDER_WAY
                } actual ship status ${eta.voyageStatus}, schedule ${JSON.stringify(schedule)}`
            );
            return [];
        }

        return (
            eta.predictions
                .filter(isAwakeEtaPrediction)
                // filter out predictions originating from digitraffic portcall api
                .filter((etaPrediction) => {
                    if (isDigitrafficEtaPrediction(etaPrediction)) {
                        console.warn(
                            `method=AwakeAiETAShipService.getAwakeAiTimestamps received Digitraffic ETA prediction, IMO: ${
                                schedule.ship.imo
                            }, MMSI: ${schedule.ship.mmsi}, prediction: ${JSON.stringify(etaPrediction)}`
                        );
                        return false;
                    }
                    return true;
                })
        );
    }
}
