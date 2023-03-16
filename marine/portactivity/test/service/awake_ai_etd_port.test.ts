import {
    AwakeAiPrediction,
    AwakeAiPredictionMetadata,
    AwakeAiPredictionType,
    AwakeAiVoyageEtdPrediction,
    AwakeAiVoyageStatus,
    AwakeAiZoneType
} from "../../lib/api/awake_common";
import * as sinon from "sinon";
import { AwakeAiPortApi, AwakeAiPortResponse } from "../../lib/api/awake_ai_port";
import { addHours, subHours } from "date-fns";
import { AwakeAiETDPortService } from "../../lib/service/awake_ai_etd_port";
import { getRandomNumber, randomBoolean } from "@digitraffic/common/dist/test/testutils";
import { createAwakeAiPortResponse } from "./awake_ai_etx_port_testutil";

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
        sinon.stub(api, "getETDs").returns(Promise.resolve(voyageTimestamp));

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
        sinon.stub(api, "getETDs").returns(Promise.resolve(voyageTimestamp));

        const timestamps = await service.getAwakeAiTimestamps("FILOL");

        expect(timestamps.length).toBe(0);
    });

    test("getAwakeAiTimestamps - filter non-ETD predictions", async () => {
        const api = createApi();
        const service = new AwakeAiETDPortService(api);
        const voyageTimestamp = createEtdResponse({
            predictionType: randomBoolean() ? AwakeAiPredictionType.ETA : AwakeAiPredictionType.DESTINATION
        });
        sinon.stub(api, "getETDs").returns(Promise.resolve(voyageTimestamp));

        const timestamps = await service.getAwakeAiTimestamps("FILOL");

        expect(timestamps.length).toBe(0);
    });

    test("getAwakeAiTimestamps - filter stopped voyages", async () => {
        const api = createApi();
        const service = new AwakeAiETDPortService(api);
        const voyageTimestamp = createEtdResponse({
            voyageStatus: AwakeAiVoyageStatus.STOPPED
        });
        sinon.stub(api, "getETDs").returns(Promise.resolve(voyageTimestamp));

        const timestamps = await service.getAwakeAiTimestamps("FILOL");

        expect(timestamps.length).toBe(0);
    });

    test("getAwakeAiTimestamps - no schedule", async () => {
        const api = createApi();
        const service = new AwakeAiETDPortService(api);
        const voyageTimestamp = createEtdResponse({
            excludeSchedule: true
        });

        sinon.stub(api, "getETDs").returns(Promise.resolve(voyageTimestamp));

        const timestamps = await service.getAwakeAiTimestamps("FILOL");

        expect(timestamps.length).toBe(0);
    });
});

function createApi() {
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
