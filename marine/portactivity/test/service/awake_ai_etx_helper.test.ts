import * as AwakeAiETAHelper from "../../lib/service/awake_ai_etx_helper";
import { isPortcallPrediction } from "../../lib/service/awake_ai_etx_helper";
import {
    AwakeAiPredictionMetadata,
    AwakeAiPredictionType,
    AwakeAiVoyageEtaPrediction,
    AwakeAiZoneType,
    AwakeDigitrafficPortCallURN,
    AwakeURN
} from "../../lib/api/awake_common";
import { EventSource } from "../../lib/model/eventsource";
import { randomIMO, randomMMSI } from "../testdata";
import { randomBoolean } from "@digitraffic/common/dist/test/testutils";
import { EventType } from "../../lib/model/timestamp";

describe("Awake.AI ETA helper", () => {
    test("destinationIsFinnish - correct", () => {
        expect(AwakeAiETAHelper.locodeIsFinnish("FILOL")).toBe(true);
    });

    test("destinationIsFinnish - case insensitive", () => {
        expect(AwakeAiETAHelper.locodeIsFinnish("fIlAn")).toBe(true);
    });

    test("destinationIsFinnish - not finnish", () => {
        expect(AwakeAiETAHelper.locodeIsFinnish("SEFOO")).toBe(false);
    });

    test("predictionToTimestamp - valid prediction", () => {
        const portcallId = 1;
        const portArea = "TEST";
        const mmsi = randomMMSI();
        const imo = randomIMO();
        const source = EventSource.AWAKE_AI;
        const eta: AwakeAiVoyageEtaPrediction = newETAPrediction();

        const ts = AwakeAiETAHelper.etaPredictionToTimestamp(
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
                : AwakeAiPredictionType.TRAVEL_TIME
        });

        const ts = AwakeAiETAHelper.etaPredictionToTimestamp(
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

        const ts = AwakeAiETAHelper.etaPredictionToTimestamp(
            eta,
            EventSource.AWAKE_AI,
            eta.locode,
            randomMMSI(),
            randomIMO()
        );

        expect(ts).toBeNull();
    });

    test("isDigitrafficEtaPrediction - correct", () => {
        const digitrafficPortCallSource: AwakeDigitrafficPortCallURN =
            "urn:awake:digitraffic-portcall:2959158";
        const digitrafficEta: AwakeAiVoyageEtaPrediction = newETAPrediction({
            predictionType: AwakeAiPredictionType.ETA,
            metadata: {
                source: digitrafficPortCallSource
            }
        });
        const awakeSource: AwakeURN = "urn:awake:source:ai:eta-prediction";
        const awakeEta: AwakeAiVoyageEtaPrediction = newETAPrediction({
            predictionType: AwakeAiPredictionType.ETA,
            metadata: {
                source: awakeSource
            }
        });

        expect(AwakeAiETAHelper.isDigitrafficEtaPrediction(digitrafficEta)).toBe(true);
        expect(AwakeAiETAHelper.isDigitrafficEtaPrediction(awakeEta)).toBe(false);
    });

    test("isPortcallPrediction - correct", () => {
        const awakeEtaPrediction = newETAPrediction();
        const awakePortCallPredictionNoType = newETAPrediction({
            portCallUrn: "urn:awake:digitraffic-portcall:1234567"
        });
        const awakePortCallPredictionInvalidUrn = newETAPrediction({
            predictionType: AwakeAiPredictionType.ARRIVAL_PORT_CALL,
            portCallUrn: "urn:awake:some-other-portcall:1234567" as AwakeDigitrafficPortCallURN
        });
        const awakePortCallPrediction = newETAPrediction({
            predictionType: AwakeAiPredictionType.ARRIVAL_PORT_CALL,
            portCallUrn: "urn:awake:digitraffic-portcall:1234567"
        });

        expect(isPortcallPrediction(awakeEtaPrediction)).toEqual(false);
        expect(isPortcallPrediction(awakePortCallPredictionNoType)).toEqual(false);
        expect(isPortcallPrediction(awakePortCallPredictionInvalidUrn)).toEqual(false);
        expect(isPortcallPrediction(awakePortCallPrediction)).toEqual(true);
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
    metadata?: AwakeAiPredictionMetadata;
    zoneType?: AwakeAiZoneType;
    portCallUrn?: AwakeDigitrafficPortCallURN;
}): AwakeAiVoyageEtaPrediction {
    return {
        predictionType: options?.predictionType ?? AwakeAiPredictionType.ETA,
        arrivalTime: options?.arrivalTime?.toISOString() ?? new Date().toISOString(),
        recordTime: options?.recordTime?.toISOString() ?? new Date().toISOString(),
        locode: options?.locode ?? "FILOL",
        metadata: options?.metadata,
        zoneType: options?.zoneType ?? AwakeAiZoneType.BERTH,
        ...(options?.portCallUrn && { portCallUrn: options.portCallUrn })
    };
}
