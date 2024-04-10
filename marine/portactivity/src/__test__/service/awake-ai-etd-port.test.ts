import type {
    AwakeAiPrediction,
    AwakeAiPredictionMetadata,
    AwakeAiVoyageEtdPrediction
} from "../../api/awake-common.js";
import { AwakeAiPredictionType, AwakeAiVoyageStatus, AwakeAiZoneType } from "../../api/awake-common.js";
import type { AwakeAiPortResponse } from "../../api/awake-ai-port.js";
import { AwakeAiPortApi } from "../../api/awake-ai-port.js";
import { addHours, subHours } from "date-fns";
import { AwakeAiETDPortService } from "../../service/awake-ai-etd-port.js";
import { getRandomNumber, randomBoolean } from "@digitraffic/common/dist/test/testutils";
import { createAwakeAiPortResponse } from "./awake-ai-etx-port-testutil.js";
import { jest } from "@jest/globals";

describe("AwakeAiETDPortService", () => {
    test("getAwakeAiTimestamps - filter Digitraffic ETD predictions", async () => {
        const api = createApi();
        const service = new AwakeAiETDPortService(api);
        const voyageTimestamp = createEtdResponse({
            voyageStatus: AwakeAiVoyageStatus.UNDER_WAY,
            predictionType: AwakeAiPredictionType.ETD,
            metadata: {
                source: "urn:awake:digitraffic-portcall:1234567"
            }
        });
        jest.spyOn(AwakeAiPortApi.prototype, "getETDs").mockResolvedValue(voyageTimestamp);

        const timestamps = await service.getAwakeAiTimestamps("FILOL");

        expect(timestamps.length).toBe(0);
    });

    test("getAwakeAiTimestamps - filter departure times in the past", async () => {
        const api = createApi();
        const service = new AwakeAiETDPortService(api);
        const voyageTimestamp = createEtdResponse({
            voyageStatus: AwakeAiVoyageStatus.UNDER_WAY,
            predictionType: AwakeAiPredictionType.ETD,
            departureTime: subHours(Date.now(), getRandomNumber(1, 23)),
            metadata: {
                source: "urn:awake:someidstring"
            }
        });
        jest.spyOn(AwakeAiPortApi.prototype, "getETDs").mockResolvedValue(voyageTimestamp);

        const timestamps = await service.getAwakeAiTimestamps("FILOL");

        expect(timestamps.length).toBe(0);
    });

    test("getAwakeAiTimestamps - filter non-ETD predictions", async () => {
        const api = createApi();
        const service = new AwakeAiETDPortService(api);
        const voyageTimestamp = createEtdResponse({
            predictionType: randomBoolean() ? AwakeAiPredictionType.ETA : AwakeAiPredictionType.DESTINATION
        });
        jest.spyOn(AwakeAiPortApi.prototype, "getETDs").mockResolvedValue(voyageTimestamp);

        const timestamps = await service.getAwakeAiTimestamps("FILOL");

        expect(timestamps.length).toBe(0);
    });

    test("getAwakeAiTimestamps - filter stopped voyages", async () => {
        const api = createApi();
        const service = new AwakeAiETDPortService(api);
        const voyageTimestamp = createEtdResponse({
            voyageStatus: AwakeAiVoyageStatus.STOPPED
        });
        jest.spyOn(AwakeAiPortApi.prototype, "getETDs").mockResolvedValue(voyageTimestamp);

        const timestamps = await service.getAwakeAiTimestamps("FILOL");

        expect(timestamps.length).toBe(0);
    });

    test("getAwakeAiTimestamps - no schedule", async () => {
        const api = createApi();
        const service = new AwakeAiETDPortService(api);
        const voyageTimestamp = createEtdResponse({
            excludeSchedule: true
        });
        jest.spyOn(AwakeAiPortApi.prototype, "getETDs").mockResolvedValue(voyageTimestamp);

        const timestamps = await service.getAwakeAiTimestamps("FILOL");

        expect(timestamps.length).toBe(0);
    });
});

function createApi(): AwakeAiPortApi {
    return new AwakeAiPortApi("", "");
}

function createEtdResponse(options?: {
    departureTime?: Date;
    voyageStatus?: AwakeAiVoyageStatus;
    predictionType?: AwakeAiPredictionType;
    includePortCallPrediction?: boolean;
    excludeSchedule?: boolean;
    metadata?: AwakeAiPredictionMetadata;
}): AwakeAiPortResponse {
    const predictions: AwakeAiPrediction[] = [
        {
            predictionType: options?.predictionType ?? AwakeAiPredictionType.ETD,
            locode: "FILOL",
            zoneType: AwakeAiZoneType.BERTH,
            recordTime: new Date().toISOString(),
            departureTime: options?.departureTime?.toISOString() ?? addHours(new Date(), 25).toISOString(),
            metadata: options?.metadata
        } as AwakeAiVoyageEtdPrediction
    ];
    return createAwakeAiPortResponse(predictions, {
        voyageStatus: options?.voyageStatus,
        includePortCallPrediction: options?.includePortCallPrediction,
        excludeSchedule: options?.excludeSchedule
    });
}
