import * as AwakeAiETAHelper from "../../lib/service/awake_ai_eta_helper";
import { isDigitrafficEtaPrediction } from "../../lib/service/awake_ai_eta_helper";
import {
    AwakeAiMetadata,
    AwakeAiPredictionType,
    AwakeAiVoyageEtaPrediction,
    AwakeAiZoneType,
} from "../../lib/api/awake_common";
import { EventSource } from "../../lib/model/eventsource";
import { randomIMO, randomMMSI } from "../testdata";
import { randomBoolean } from "@digitraffic/common/dist/test/testutils";
import { EventType } from "../../lib/model/timestamp";

describe("Awake.AI ETA helper", () => {
    test("destinationIsFinnish - correct", () => {
        expect(AwakeAiETAHelper.destinationIsFinnish("FILOL")).toBe(true);
    });

    test("destinationIsFinnish - case insensitive", () => {
        expect(AwakeAiETAHelper.destinationIsFinnish("fIlAn")).toBe(true);
    });

    test("destinationIsFinnish - not finnish", () => {
        expect(AwakeAiETAHelper.destinationIsFinnish("SEFOO")).toBe(false);
    });

    test("predictionToTimestamp - valid prediction", () => {
        const portcallId = 1;
        const portArea = "TEST";
        const mmsi = randomMMSI();
        const imo = randomIMO();
        const source = EventSource.AWAKE_AI;
        const eta: AwakeAiVoyageEtaPrediction = newETAPrediction();

        const ts = AwakeAiETAHelper.predictionToTimestamp(
            eta,
            source,
            eta.locode,
            mmsi,
            imo,
            portArea,
            portcallId
        );

        expect(ts).not.toBeNull();
        if (ts !== null) {
            expect(ts.eventType).toBe(EventType.ETA);
            expect(ts.ship.mmsi).toBe(mmsi);
            expect(ts.ship.imo).toBe(imo);
            expect(ts.recordTime).toBe(eta.recordTime);
            expect(ts.eventTime).toBe(eta.arrivalTime);
            expect(ts.source).toBe(source);
            expect(ts.location.port).toBe(eta.locode);
            expect(ts.location.portArea).toBe(portArea);
            expect(ts.portcallId).toBe(portcallId);
        }
    });

    test("predictionToTimestamp - wrong prediction type", () => {
        const eta: AwakeAiVoyageEtaPrediction = newETAPrediction({
            predictionType: randomBoolean()
                ? AwakeAiPredictionType.DESTINATION
                : AwakeAiPredictionType.TRAVEL_TIME,
        });

        const ts = AwakeAiETAHelper.predictionToTimestamp(
            eta,
            EventSource.AWAKE_AI,
            eta.locode,
            randomMMSI(),
            randomIMO()
        );

        expect(ts).toBeNull();
    });

    test("predictionToTimestamp - no arrival time", () => {
        const eta: AwakeAiVoyageEtaPrediction = newETAPrediction();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        (eta as any).arrivalTime = undefined;

        const ts = AwakeAiETAHelper.predictionToTimestamp(
            eta,
            EventSource.AWAKE_AI,
            eta.locode,
            randomMMSI(),
            randomIMO()
        );

        expect(ts).toBeNull();
    });

    test("isDigitrafficEtaPrediction - correct", () => {
        const digitrafficEta: AwakeAiVoyageEtaPrediction = newETAPrediction({
            predictionType: AwakeAiPredictionType.ETA,
            metadata: {
                source: "urn:awake:digitraffic-portcall:2959158",
            },
        });
        const awakeEta: AwakeAiVoyageEtaPrediction = newETAPrediction({
            predictionType: AwakeAiPredictionType.ETA,
            metadata: {
                source: "urn:awake:source:ai",
            },
        });

        expect(isDigitrafficEtaPrediction(digitrafficEta)).toBe(true);
        expect(isDigitrafficEtaPrediction(awakeEta)).toBe(false);
    });
});

/**
 * Creates a valid ETA prediction
 * @param options
 */
function newETAPrediction(options?: {
    predictionType?: AwakeAiPredictionType;
    arrivalTime?: Date;
    recordTime?: Date;
    locode?: string;
    metadata?: AwakeAiMetadata;
    zoneType?: AwakeAiZoneType;
}): AwakeAiVoyageEtaPrediction {
    return {
        predictionType: options?.predictionType ?? AwakeAiPredictionType.ETA,
        arrivalTime:
            options?.arrivalTime?.toISOString() ?? new Date().toISOString(),
        recordTime:
            options?.recordTime?.toISOString() ?? new Date().toISOString(),
        locode: options?.locode ?? "FILOL",
        metadata: options?.metadata ?? { source: "abc" },
        zoneType: options?.zoneType ?? AwakeAiZoneType.BERTH,
    };
}
