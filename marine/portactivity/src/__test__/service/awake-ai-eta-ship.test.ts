import * as sinon from "sinon";
import type { AwakeAiShipApiResponse } from "../../api/awake-ai-ship.js";
import {
    AwakeAiETAShipApi,
    AwakeAiShipPredictability,
    AwakeAiShipResponseType
} from "../../api/awake-ai-ship.js";
import { AwakeAiETAShipService } from "../../service/awake-ai-eta-ship.js";
import type { DbETAShip } from "../../dao/timestamps.js";
import type { ApiTimestamp } from "../../model/timestamp.js";
import { EventType } from "../../model/timestamp.js";
import type { AwakeAiPredictionMetadata, AwakeAiVoyageEtaPrediction } from "../../api/awake-common.js";
import { AwakeAiPredictionType, AwakeAiVoyageStatus, AwakeAiZoneType } from "../../api/awake-common.js";
import { getRandomInteger, randomBoolean } from "@digitraffic/common/dist/test/testutils";
import { EventSource } from "../../model/eventsource.js";
import { addHours } from "date-fns";
import _ from "lodash";
import type { Locode } from "../../model/locode.js";

/**
 * Note: Since it is a source of VTS A timestamps,
 * all ETA timestamps from the Awake.AI /ship API
 * should also be published as ETB timestamps.
 */

describe("AwakeAiETAShipService", () => {
    test("getAwakeAiTimestamps - creates both ETA and ETB", async () => {
        const api = createApi();
        const service = new AwakeAiETAShipService(api);
        const ship = newDbETAShip("FIPOR");
        const mmsi = 123456789;
        const voyageTimestamp = createVoyageResponse(ship.locode, ship.imo, mmsi);
        sinon.stub(api, "getETA").returns(Promise.resolve(voyageTimestamp));

        const timestamps = await service.getAwakeAiTimestamps([ship]);

        expectEtaAndEtb(ship, timestamps);
    });

    test("getAwakeAiTimestamps - no timestamps when predicted locode differs and ETA is >= 24 h", async () => {
        const api = createApi();
        const service = new AwakeAiETAShipService(api);
        const ship = newDbETAShip("FIKEK", addHours(Date.now(), getRandomInteger(24, 100)));
        sinon
            .stub(api, "getETA")
            .returns(Promise.resolve(createVoyageResponse("FILOL", ship.imo, 123456789)));

        const timestamps = await service.getAwakeAiTimestamps([ship]);

        expect(timestamps.length).toBe(0);
    });

    test("getAwakeAiTimestamps - timestamps created when predicted locode differs and ETA is < 24 h", async () => {
        const api = createApi();
        const service = new AwakeAiETAShipService(api);
        const ship = newDbETAShip("FIKEK", addHours(Date.now(), getRandomInteger(1, 23)));
        const voyageTimestamp = createVoyageResponse("FILOL", ship.imo, 123456789);
        sinon.stub(api, "getETA").returns(Promise.resolve(voyageTimestamp));

        const timestamps = await service.getAwakeAiTimestamps([ship]);

        expectEtaAndEtb(ship, timestamps);
    });

    test("getAwakeAiTimestamps - ship not under way", async () => {
        const api = createApi();
        const service = new AwakeAiETAShipService(api);
        const ship = newDbETAShip();
        const mmsi = 123456789;
        const notUnderWayStatuses = [AwakeAiVoyageStatus.STOPPED, AwakeAiVoyageStatus.NOT_STARTED];
        const status = notUnderWayStatuses[Math.floor(Math.random() * 2)]; // get random status
        sinon.stub(api, "getETA").returns(
            Promise.resolve(
                createVoyageResponse(ship.locode, ship.imo, mmsi, {
                    status
                })
            )
        );

        const timestamps = await service.getAwakeAiTimestamps([ship]);

        expect(timestamps.length).toBe(0);
    });

    test("getAwakeAiTimestamps - not predictable", async () => {
        const api = createApi();
        const service = new AwakeAiETAShipService(api);
        const ship = newDbETAShip();
        sinon.stub(api, "getETA").returns(
            Promise.resolve({
                type: AwakeAiShipResponseType.OK,
                schedule: {
                    ship: {
                        imo: ship.imo,
                        mmsi: 123456789
                    },
                    predictability: randomBoolean()
                        ? AwakeAiShipPredictability.NOT_PREDICTABLE
                        : AwakeAiShipPredictability.SHIP_DATA_NOT_UPDATED,
                    predictedVoyages: []
                }
            })
        );

        const timestamps = await service.getAwakeAiTimestamps([ship]);

        expect(timestamps.length).toBe(0);
    });

    test("getAwakeAiTimestamps - no predicted voyages", async () => {
        const api = createApi();
        const service = new AwakeAiETAShipService(api);
        const ship = newDbETAShip();
        const response = createVoyageResponse(ship.locode, ship.imo, 123456789);
        _.set(response, ["schedule", "predictedVoyages"], []);
        sinon.stub(api, "getETA").returns(Promise.resolve(response));

        const timestamps = await service.getAwakeAiTimestamps([ship]);

        expect(timestamps.length).toBe(0);
    });

    test("getAwakeAiTimestamps - no ETA predictions", async () => {
        const api = createApi();
        const service = new AwakeAiETAShipService(api);
        const ship = newDbETAShip();
        const response = createVoyageResponse(ship.locode, ship.imo, 123456789);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        (response.schedule as any).predictedVoyages[0].predictions = [];
        sinon.stub(api, "getETA").returns(Promise.resolve(response));

        const timestamps = await service.getAwakeAiTimestamps([ship]);

        expect(timestamps.length).toBe(0);
    });

    test("getAwakeAiTimestamps - no predicted destination", async () => {
        const api = createApi();
        const service = new AwakeAiETAShipService(api);
        const ship = newDbETAShip();
        const response = createVoyageResponse(ship.locode, ship.imo, 123456789);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        delete (response.schedule as any).predictedVoyages[0].predictions[0].locode;
        sinon.stub(api, "getETA").returns(Promise.resolve(response));

        const timestamps = await service.getAwakeAiTimestamps([ship]);

        expect(timestamps.length).toBe(0);
    });

    test("getAwakeAiTimestamps - port outside Finland", async () => {
        const api = createApi();
        const service = new AwakeAiETAShipService(api);
        const ship = newDbETAShip();
        const response = createVoyageResponse("EEMUG", ship.imo, 123456789);
        sinon.stub(api, "getETA").returns(Promise.resolve(response));

        const timestamps = await service.getAwakeAiTimestamps([ship]);

        expect(timestamps.length).toBe(0);
    });

    test("getAwakeAiTimestamps - pilotage ETP for ports in list", async () => {
        const api = createApi();
        const service = new AwakeAiETAShipService(api);
        for (const locode of service.publishAsETPDestinations) {
            const ship = newDbETAShip(locode);
            const response = createVoyageResponse(locode, ship.imo, 123456789, {
                zoneType: AwakeAiZoneType.PILOT_BOARDING_AREA
            });
            const stub = sinon.stub(api, "getETA").returns(Promise.resolve(response));

            const timestamps = await service.getAwakeAiTimestamps([ship]);

            expect(timestamps.length).toBe(1);
            expect(timestamps[0]).toMatchObject(
                awakeTimestampFromTimestamp(timestamps[0], ship.port_area_code, EventType.ETP)
            );

            stub.restore();
        }
    });

    test("getAwakeAiTimestamps - no pilotage ETP if not in list", async () => {
        const api = createApi();
        const service = new AwakeAiETAShipService(api);
        const locode: Locode = "FIHEL";
        const ship = newDbETAShip(locode);
        expect(service.publishAsETPDestinations.includes(locode)).toBe(false);
        const response = createVoyageResponse(locode, ship.imo, 123456789, {
            zoneType: AwakeAiZoneType.PILOT_BOARDING_AREA
        });
        sinon.stub(api, "getETA").returns(Promise.resolve(response));

        const timestamps = await service.getAwakeAiTimestamps([ship]);

        expect(timestamps.length).toBe(0);
    });

    test("getAwakeAiTimestamps - port locode override", async () => {
        const api = createApi();
        const service = new AwakeAiETAShipService(api);
        const ship = newDbETAShip(
            service.overriddenDestinations[getRandomInteger(0, service.overriddenDestinations.length - 1)]
        );
        const voyageTimestamp = createVoyageResponse("FIKEK", ship.imo, 123456789);
        sinon.stub(api, "getETA").returns(Promise.resolve(voyageTimestamp));

        const timestamps = await service.getAwakeAiTimestamps([ship]);

        expectEtaAndEtb(ship, timestamps);
    });

    test("getAwakeAiTimestamps - destination set explicitly when original ETA is less than 24 h", async () => {
        const locode = "FIKEK";
        const api = createApi();
        const service = new AwakeAiETAShipService(api);
        const ship = newDbETAShip(locode, addHours(Date.now(), 1));
        const getETAStub = sinon
            .stub(api, "getETA")
            .returns(Promise.resolve(createVoyageResponse(locode, ship.imo, 123456789)));

        await service.getAwakeAiTimestamps([ship]);

        expect(getETAStub.calledWith(ship.imo, locode)).toBe(true);
    });

    test("getAwakeAiTimestamps - destination not set when original ETA is more than 24 h", async () => {
        const locode = "FIKEK";
        const api = createApi();
        const service = new AwakeAiETAShipService(api);
        const ship = newDbETAShip(locode, addHours(Date.now(), 25));
        const getETAStub = sinon
            .stub(api, "getETA")
            .returns(Promise.resolve(createVoyageResponse(locode, ship.imo, 123456789)));

        await service.getAwakeAiTimestamps([ship]);

        expect(getETAStub.calledWith(ship.imo)).toBe(true);
    });

    test("getAwakeAiTimestamps - retry", async () => {
        const api = createApi();
        const service = new AwakeAiETAShipService(api);
        const ship = newDbETAShip();
        const voyageTimestamp = createVoyageResponse(ship.locode, ship.imo, 123456789);
        const apiGetETAStub = sinon.stub(api, "getETA");
        apiGetETAStub.onFirstCall().returns(Promise.reject("error"));
        apiGetETAStub.onSecondCall().returns(Promise.resolve(voyageTimestamp));

        const timestamps = await service.getAwakeAiTimestamps([ship]);

        expectEtaAndEtb(ship, timestamps);
    });

    test("getAwakeAiTimestamps - retry fail", async () => {
        const api = createApi();
        const service = new AwakeAiETAShipService(api);
        const ship = newDbETAShip();
        const response = createVoyageResponse(ship.locode, ship.imo, 123456789);
        const apiGetETAStub = sinon.stub(api, "getETA");
        apiGetETAStub.onFirstCall().returns(Promise.reject("error"));
        apiGetETAStub.onSecondCall().returns(Promise.reject("error"));
        apiGetETAStub.onThirdCall().returns(Promise.resolve(response));

        const timestamps = await service.getAwakeAiTimestamps([ship]);

        expect(timestamps.length).toBe(0);
    });

    test("getAwakeAiTimestamps - filter Digitraffic ETA predictions", async () => {
        const api = createApi();
        const service = new AwakeAiETAShipService(api);
        const ship = newDbETAShip();
        const voyageTimestamp = createVoyageResponse(ship.locode, ship.imo, 123456789, {
            metadata: {
                source: "urn:awake:digitraffic-portcall:2959158"
            }
        });
        sinon.stub(api, "getETA").returns(Promise.resolve(voyageTimestamp));

        const timestamps = await service.getAwakeAiTimestamps([ship]);

        expect(timestamps.length).toBe(0);
    });
});

function createVoyageResponse(
    locode: string,
    imo: number,
    mmsi: number,
    options?: {
        status?: AwakeAiVoyageStatus;
        zoneType?: AwakeAiZoneType;
        metadata?: AwakeAiPredictionMetadata;
    }
): AwakeAiShipApiResponse {
    const etaPrediction: AwakeAiVoyageEtaPrediction = {
        recordTime: new Date().toISOString(),
        locode: locode,
        predictionType: AwakeAiPredictionType.ETA,
        arrivalTime: new Date().toISOString(),
        zoneType: options?.zoneType ?? AwakeAiZoneType.BERTH,
        metadata: options?.metadata
    };

    return {
        type: AwakeAiShipResponseType.OK,
        schedule: {
            ship: {
                mmsi,
                imo
            },
            predictability: AwakeAiShipPredictability.PREDICTABLE,
            predictedVoyages: [
                {
                    voyageStatus: options?.status ?? AwakeAiVoyageStatus.UNDER_WAY,
                    sequenceNo: 0,
                    predictions: [etaPrediction]
                }
            ]
        }
    };
}

function createApi(): AwakeAiETAShipApi {
    return new AwakeAiETAShipApi("", "");
}

function newDbETAShip(locode?: string, eta?: Date, imo: number = 1234567): DbETAShip {
    return {
        imo,
        locode: locode ?? "FILOL",
        port_area_code: "FOO",
        portcall_id: 123,
        eta: eta ?? addHours(Date.now(), getRandomInteger(1, 24))
    };
}

function awakeTimestampFromTimestamp(
    timestamp: ApiTimestamp | undefined,
    portArea?: string,
    eventType?: EventType
): ApiTimestamp {
    if (timestamp === undefined) {
        fail();
    }

    return {
        ship: timestamp.ship,
        location: { ...timestamp.location, portArea },
        source: EventSource.AWAKE_AI,
        eventType: eventType ?? EventType.ETA,
        eventTime: timestamp.eventTime,
        recordTime: timestamp.recordTime
    };
}

function expectEtaAndEtb(ship: DbETAShip, timestamps: ApiTimestamp[]): void {
    expect(timestamps.length).toBe(2);
    const etaTimestamp = timestamps.find((ts) => ts.eventType === EventType.ETA);
    const etbTimestamp = timestamps.find((ts) => ts.eventType === EventType.ETB);

    expect(etaTimestamp).toMatchObject(
        awakeTimestampFromTimestamp(etaTimestamp, ship.port_area_code, EventType.ETA)
    );
    expect(etbTimestamp).toMatchObject(
        awakeTimestampFromTimestamp(etbTimestamp, ship.port_area_code, EventType.ETB)
    );
}
