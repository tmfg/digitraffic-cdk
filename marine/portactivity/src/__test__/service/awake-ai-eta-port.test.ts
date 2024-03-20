import * as sinon from "sinon";
import { AwakeAiETAPortService } from "../../service/awake-ai-eta-port.js";
import type { AwakeAiPortResponse } from "../../api/awake-ai-port.js";
import { AwakeAiPortApi } from "../../api/awake-ai-port.js";
import type {
    AwakeAiPrediction,
    AwakeAiPredictionMetadata,
    AwakeAiVoyageEtaPrediction
} from "../../api/awake-common.js";
import { AwakeAiPredictionType, AwakeAiVoyageStatus, AwakeAiZoneType } from "../../api/awake-common.js";
import { getRandomNumber, randomBoolean } from "@digitraffic/common/dist/test/testutils";
import { addHours, subHours } from "date-fns";
import { createAwakeAiPortResponse } from "./awake-ai-etx-port-testutil.js";

describe("AwakeAiETAPortService(", () => {
    test("getAwakeAiTimestamps - no schedule", async () => {
        const api = createApi();
        const service = new AwakeAiETAPortService(api);
        const voyageTimestamp = createEtaResponse({
            excludeSchedule: true,
            includePortCallPrediction: true
        });

        sinon.stub(api, "getETAs").returns(Promise.resolve(voyageTimestamp));

        const timestamps = await service.getAwakeAiTimestamps("FILOL");

        expect(timestamps.length).toBe(0);
    });

    test("getAwakeAiTimestamps - filter stopped voyages", async () => {
        const api = createApi();
        const service = new AwakeAiETAPortService(api);
        const voyageTimestamp = createEtaResponse({
            voyageStatus: AwakeAiVoyageStatus.STOPPED,
            includePortCallPrediction: true
        });
        sinon.stub(api, "getETAs").returns(Promise.resolve(voyageTimestamp));

        const timestamps = await service.getAwakeAiTimestamps("FILOL");

        expect(timestamps.length).toBe(0);
    });

    test("getAwakeAiTimestamps - non-ETA", async () => {
        const api = createApi();
        const service = new AwakeAiETAPortService(api);
        const voyageTimestamp = createEtaResponse({
            predictionType: randomBoolean()
                ? AwakeAiPredictionType.TRAVEL_TIME
                : AwakeAiPredictionType.DESTINATION
        });
        sinon.stub(api, "getETAs").returns(Promise.resolve(voyageTimestamp));

        const timestamps = await service.getAwakeAiTimestamps("FILOL");

        expect(timestamps.length).toBe(0);
    });

    test("getAwakeAiTimestamps - 24 hours or closer", async () => {
        const api = createApi();
        const service = new AwakeAiETAPortService(api);
        const voyageTimestamp = createEtaResponse({
            arrivalTime: subHours(new Date(), getRandomNumber(1, 23)),
            voyageStatus: AwakeAiVoyageStatus.UNDER_WAY,
            predictionType: AwakeAiPredictionType.ETA,
            includePortCallPrediction: true
        });
        sinon.stub(api, "getETAs").returns(Promise.resolve(voyageTimestamp));

        const timestamps = await service.getAwakeAiTimestamps("FILOL");

        expect(timestamps.length).toBe(0);
    });

    test("getAwakeAiTimestamps - filter Digitraffic ETA predictions", async () => {
        const api = createApi();
        const service = new AwakeAiETAPortService(api);
        const voyageTimestamp = createEtaResponse({
            voyageStatus: AwakeAiVoyageStatus.UNDER_WAY,
            predictionType: AwakeAiPredictionType.ETA,
            includePortCallPrediction: true,
            metadata: {
                source: "urn:awake:digitraffic-portcall:2959158"
            }
        });
        sinon.stub(api, "getETAs").returns(Promise.resolve(voyageTimestamp));

        const timestamps = await service.getAwakeAiTimestamps("FILOL");

        expect(timestamps.length).toBe(0);
    });

    test("getAwakeAiTimestamps - correct with port call prediction", async () => {
        const api = createApi();
        const service = new AwakeAiETAPortService(api);
        sinon
            .stub(api, "getETAs")
            .returns(Promise.resolve(createEtaResponse({ includePortCallPrediction: true })));

        const timestamps = await service.getAwakeAiTimestamps("FILOL");

        expect(timestamps.length).toBe(1);
    });

    test("getAwakeAiTimestamps - correct without port call prediction", async () => {
        const api = createApi();
        const service = new AwakeAiETAPortService(api);
        sinon
            .stub(api, "getETAs")
            .returns(Promise.resolve(createEtaResponse({ includePortCallPrediction: false })));

        const timestamps = await service.getAwakeAiTimestamps("FILOL");

        expect(timestamps.length).toBe(1);
    });
});

function createApi(): AwakeAiPortApi {
    return new AwakeAiPortApi("", "");
}

function createEtaResponse(options?: {
    arrivalTime?: Date;
    voyageStatus?: AwakeAiVoyageStatus;
    predictionType?: AwakeAiPredictionType;
    includePortCallPrediction?: boolean;
    excludeSchedule?: boolean;
    metadata?: AwakeAiPredictionMetadata;
}): AwakeAiPortResponse {
    const predictions: AwakeAiPrediction[] = [
        {
            predictionType: options?.predictionType ?? AwakeAiPredictionType.ETA,
            locode: "FILOL",
            zoneType: AwakeAiZoneType.BERTH,
            recordTime: new Date().toISOString(),
            arrivalTime: options?.arrivalTime?.toISOString() ?? addHours(new Date(), 25).toISOString(),
            metadata: options?.metadata
        } as AwakeAiVoyageEtaPrediction
    ];
    return createAwakeAiPortResponse(predictions, {
        voyageStatus: options?.voyageStatus,
        includePortCallPrediction: options?.includePortCallPrediction,
        excludeSchedule: options?.excludeSchedule
    });
}
