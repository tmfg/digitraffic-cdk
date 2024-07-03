import { type DTDatabase, inDatabaseReadonly } from "@digitraffic/common/dist/database/database";
import * as LastUpdatedDb from "@digitraffic/common/dist/database/last-updated";
import { Asserter } from "@digitraffic/common/dist/test/asserter";
import * as CommonDateUtils from "@digitraffic/common/dist/utils/date-utils";
import { type GeoJsonLineString } from "@digitraffic/common/dist/utils/geojson-types";
import { type Position } from "geojson";
import { add } from "date-fns/add";
import { sub } from "date-fns/sub";
import { AutoriApi } from "../../api/autori.js";
import { AUTORI_MAX_DISTANCE_BETWEEN_TRACKINGS_M, AUTORI_MAX_MINUTES_TO_HISTORY } from "../../constants.js";
import * as DataDb from "../../dao/data.js";
import type { ApiContractData, ApiOperationData, ApiRouteData } from "../../model/autori-api-data.js";
import { type DbDomainContract, type DbDomainTaskMapping } from "../../model/db-data.js";
import { UNKNOWN_TASK_NAME } from "../../model/tracking-save-result.js";
import { AutoriUpdate } from "../../service/autori-update.js";
import * as AutoriUtils from "../../service/autori-utils.js";
import * as AutoriTestutils from "../autori-testutil.js";
import {
    dbTestBase,
    findAllDomaindContracts,
    findAllTrackings,
    insertDomain,
    insertDomaindContract,
    insertDomaindTaskMapping,
    truncate
} from "../db-testutil.js";
import {
    AUTORI_OPERATION_BRUSHING,
    AUTORI_OPERATION_PAVING,
    CONTRACT_ID,
    DOMAIN_1,
    HARJA_BRUSHING,
    HARJA_PAVING,
    HARJA_SALTING,
    POINT_START,
    SOURCE_1
} from "../testconstants.js";
import { createLineString, createLineStringGeometries, createZigZagCoordinates } from "../testutil.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { jest } from "@jest/globals";

const autoriUpdateService = createAutoriUpdateService();

function createAutoriUpdateService(): AutoriUpdate {
    return new AutoriUpdate(AutoriApi.prototype);
}

describe(
    "autori-update-service-test",
    dbTestBase((db: DTDatabase) => {
        beforeEach(async () => {
            await truncate(db);
        });

        afterEach(async () => {
            await truncate(db);
        });

        test("resolveNextStartTimeForDataFetchFromHistory", () => {
            const lastUdated = sub(new Date(), { minutes: 1 });
            const contract = {
                contract: CONTRACT_ID,
                data_last_updated: lastUdated,
                domain: DOMAIN_1,
                start_date: sub(new Date(), { days: 30 }),
                end_date: add(new Date(), { days: 30 }),
                name: "Urakka 1",
                source: "Foo / Bar"
            } as DbDomainContract;
            const resolved = AutoriUtils.resolveNextStartTimeForDataFromApi(contract);
            expect(resolved).toEqual(lastUdated);
        });

        test("resolveNextStartTimeForDataFetchFromHistory over 12 month", () => {
            // max from 1.1.2022 or < 12 months - 1h
            const shouldResolveTo = sub(new Date(), { minutes: AUTORI_MAX_MINUTES_TO_HISTORY });

            const lastUdated = sub(new Date(), { months: 13 });
            const contract = {
                contract: CONTRACT_ID,
                data_last_updated: lastUdated,
                domain: DOMAIN_1,
                start_date: sub(new Date(), { days: 30 }),
                end_date: add(new Date(), { days: 30 }),
                name: "Urakka 1",
                source: "Foo / Bar"
            } as DbDomainContract;
            const resolved = AutoriUtils.resolveNextStartTimeForDataFromApi(contract);
            Asserter.assertToBeCloseTo(resolved.getTime(), shouldResolveTo.getTime(), 10000);
        });

        test("resolveNextStartTimeForDataFetchFromHistory start date", () => {
            const startDate = sub(new Date(), { minutes: 2 });
            const contract = {
                contract: CONTRACT_ID,
                data_last_updated: undefined,
                domain: DOMAIN_1,
                start_date: startDate,
                end_date: add(new Date(), { days: 30 }),
                name: "Urakka 1",
                source: "Foo / Bar"
            } as DbDomainContract;
            const resolved = AutoriUtils.resolveNextStartTimeForDataFromApi(contract);
            expect(resolved).toEqual(startDate);
        });

        test("resolveNextStartTimeForDataFetchFromHistory fall back", () => {
            const fallBackMin = sub(new Date(), {
                minutes: AUTORI_MAX_MINUTES_TO_HISTORY,
                seconds: 1 // one second more than max value
            }).getTime();
            const fallBackMax = sub(new Date(), {
                minutes: AUTORI_MAX_MINUTES_TO_HISTORY,
                seconds: -1 // sub -1 s == add 1 s. Sub max minutes and add one second.
            }).getTime();
            const contract = {
                contract: CONTRACT_ID,
                data_last_updated: undefined,
                domain: DOMAIN_1,
                start_date: undefined,
                end_date: undefined,
                name: "Urakka 1",
                source: "Foo / Bar"
            } as DbDomainContract;
            const resolved = AutoriUtils.resolveNextStartTimeForDataFromApi(contract);
            logger.debug(`min ${fallBackMin} actual ${resolved.getTime()} max ${fallBackMax}`);
            expect(resolved.getTime()).toBeGreaterThanOrEqual(fallBackMin);
            expect(resolved.getTime()).toBeLessThanOrEqual(fallBackMax);
        });

        test("updateTasks", async () => {
            await insertDomain(db, DOMAIN_1, SOURCE_1);

            const operations = [
                AutoriTestutils.createApiOperationData(AUTORI_OPERATION_BRUSHING, DOMAIN_1),
                AutoriTestutils.createApiOperationData(AUTORI_OPERATION_PAVING, DOMAIN_1)
            ];
            mockGetOperationsApiResponse(operations);

            await autoriUpdateService.updateTaskMappingsForDomain(DOMAIN_1);

            const taskMappings1: DbDomainTaskMapping[] = await inDatabaseReadonly((ro: DTDatabase) => {
                return DataDb.getTaskMappings(ro, DOMAIN_1);
            });

            expect(taskMappings1.length).toEqual(2);
            expect(taskMappings1[0]!.name).toEqual(UNKNOWN_TASK_NAME);
            expect(taskMappings1[1]!.name).toEqual(UNKNOWN_TASK_NAME);
            expect(taskMappings1.find((t) => t.original_id === AUTORI_OPERATION_BRUSHING)?.domain).toEqual(
                DOMAIN_1
            );
            expect(taskMappings1.find((t) => t.original_id === AUTORI_OPERATION_PAVING)?.domain).toEqual(
                DOMAIN_1
            );
        });

        test("updateTasks existing not changed", async () => {
            await insertDomain(db, DOMAIN_1, SOURCE_1);
            await insertDomaindTaskMapping(db, HARJA_SALTING, AUTORI_OPERATION_BRUSHING, DOMAIN_1, false);

            const operations = [AutoriTestutils.createApiOperationData(AUTORI_OPERATION_BRUSHING, DOMAIN_1)];
            mockGetOperationsApiResponse(operations);

            await autoriUpdateService.updateTaskMappingsForDomain(DOMAIN_1);

            const taskMappings1: DbDomainTaskMapping[] = await inDatabaseReadonly((ro: DTDatabase) => {
                return DataDb.getTaskMappings(ro, DOMAIN_1);
            });

            expect(taskMappings1.length).toEqual(1);
            expect(taskMappings1[0]!.name).toEqual(HARJA_SALTING);
            expect(taskMappings1[0]!.ignore).toEqual(false);
            expect(taskMappings1[0]!.domain).toEqual(DOMAIN_1);
            expect(taskMappings1[0]!.original_id).toEqual(AUTORI_OPERATION_BRUSHING);
        });

        test("updateContracts", async () => {
            const contract1Name = "Urakka 1";
            const contract2Name = "Urakka 2";
            const contract1NewEndDate = add(new Date(), { years: 1 });
            const contracts = [
                AutoriTestutils.createApiContractData(contract1Name, contract1NewEndDate),
                AutoriTestutils.createApiContractData(contract2Name)
            ];
            await insertDomain(db, DOMAIN_1, SOURCE_1);

            // Insert one exiting contract with endin date today
            const contract1 = contracts[0]!;
            await insertDomaindContract(
                db,
                DOMAIN_1,
                contract1.id,
                contract1.name,
                SOURCE_1,
                contract1.startDate ? CommonDateUtils.dateFromIsoString(contract1.startDate) : undefined,
                new Date()
            );

            // api responses with existing contract (with a new end date) and a new one
            mockGetContractsApiResponse(contracts);

            await autoriUpdateService.updateContractsForDomain(DOMAIN_1);

            // We should only get the existing with updated end date as the new one don't have source
            const contractsWithSouce: DbDomainContract[] = await inDatabaseReadonly((ro: DTDatabase) => {
                return DataDb.getContractsWithSource(ro, DOMAIN_1);
            });

            expect(contractsWithSouce.length).toEqual(1);
            const contract = contractsWithSouce[0]!;
            expect(contract.contract).toEqual(contract1.id);
            expect(contract.domain).toEqual(DOMAIN_1);
            expect(contract.name).toEqual(contract1Name);
            expect(contract.source).toEqual(SOURCE_1);
            expect(contract.end_date).toEqual(contract1NewEndDate);

            const all = await findAllDomaindContracts(db, DOMAIN_1);
            const dbContract2 = all.find((c) => c.contract === contracts[1]!.id);
            expect(dbContract2?.name).toEqual(contract2Name);
            expect(dbContract2?.source).toBeNull();
        });

        test("updateTrackings", async () => {
            const contractName = "Urakka 1";
            const past3 = sub(new Date(), { minutes: 6 });
            const past2 = sub(new Date(), { minutes: 4 });
            const past1 = sub(new Date(), { minutes: 2 });

            await insertDomain(db, DOMAIN_1, SOURCE_1);
            await insertDomaindContract(
                db,
                DOMAIN_1,
                CONTRACT_ID,
                contractName,
                SOURCE_1,
                sub(new Date(), { months: 1 }),
                add(new Date(), { months: 1 }),
                past3
            );
            await insertDomaindTaskMapping(db, HARJA_BRUSHING, AUTORI_OPERATION_BRUSHING, DOMAIN_1, false);
            await insertDomaindTaskMapping(db, HARJA_PAVING, AUTORI_OPERATION_PAVING, DOMAIN_1, false);

            // Create two routes, 2 days and 1 day old
            const route2d: ApiRouteData = AutoriTestutils.createApiRouteData(
                past2,
                createLineStringGeometries(1, 1),
                [AUTORI_OPERATION_BRUSHING]
            );
            const route1d: ApiRouteData = AutoriTestutils.createApiRouteData(
                past1,
                createLineStringGeometries(1, 1),
                [AUTORI_OPERATION_PAVING]
            );

            // Sub api to return those routes
            // const stub = getStubForGetNextRouteDataForContract();
            // mockGetNextRouteDataForContractApiResponse(stub, contract, past3, [route2d]);
            // mockGetNextRouteDataForContractApiResponse(stub, contract, past2, [route1d]);
            // mockGetNextRouteDataForContractApiResponse(stub, contract, past1, []);
            mockGetWorkEventsApiResponse([route2d, route1d]);
            await autoriUpdateService.updateTrackingsForDomain(DOMAIN_1);
            const updateTime = Date.now();
            const trackings = await findAllTrackings(db, DOMAIN_1);
            expect(trackings.length).toEqual(2);
            const olderTracking = trackings.find((t) => t.message_original_id === route2d.id);
            const latestTracking = trackings.find((t) => t.message_original_id === route1d.id);

            expect(olderTracking?.tasks.length).toEqual(1);
            expect(olderTracking?.tasks).toContain(HARJA_BRUSHING);
            expect(olderTracking?.start_time).toEqual(
                AutoriTestutils.createTrackingStartTimeFromUpdatedTime(past2)
            );
            expect(olderTracking?.end_time).toEqual(
                AutoriTestutils.createTrackingEndTimeFromUpdatedTime(past2)
            );

            expect(latestTracking?.tasks.length).toEqual(1);
            expect(latestTracking?.tasks).toContain(HARJA_PAVING);
            expect(latestTracking?.start_time).toEqual(
                AutoriTestutils.createTrackingStartTimeFromUpdatedTime(past1)
            );
            expect(latestTracking?.end_time).toEqual(
                AutoriTestutils.createTrackingEndTimeFromUpdatedTime(past1)
            );

            const checked = await LastUpdatedDb.getLastUpdatedWithSubtype(
                db,
                LastUpdatedDb.DataType.MAINTENANCE_TRACKING_DATA_CHECKED,
                DOMAIN_1
            );

            if (checked) {
                Asserter.assertToBeCloseTo(checked.getTime(), updateTime, 500);
            } else {
                fail("checked was null");
            }

            // Check all coordinates has z value 0.5
            expect(trackings.length).toBe(2);
            trackings.forEach((value) => {
                expect(value.last_point.coordinates[2]).toEqual(0.5);
                const coordinates = (value.geometry as GeoJsonLineString).coordinates;
                expect(coordinates.length).toBeGreaterThanOrEqual(1);
                coordinates.forEach((c) => {
                    expect(c[2]).toEqual(0.5);
                });
            });
        });

        test("updateTrackings invalid linestring", async () => {
            const contractName = "Urakka 1";
            await insertDomain(db, DOMAIN_1, SOURCE_1);
            await insertDomaindContract(
                db,
                DOMAIN_1,
                CONTRACT_ID,
                contractName,
                SOURCE_1,
                new Date(),
                add(new Date(), { months: 1 }),
                new Date()
            );
            await insertDomaindTaskMapping(db, HARJA_BRUSHING, AUTORI_OPERATION_BRUSHING, DOMAIN_1, false);

            // Create one route with invalid linestring
            const route: ApiRouteData = AutoriTestutils.createApiRouteData(
                new Date(),
                [createLineString([POINT_START, POINT_START])],
                [AUTORI_OPERATION_BRUSHING]
            );

            mockGetWorkEventsApiResponse([route]);
            await autoriUpdateService.updateTrackingsForDomain(DOMAIN_1);
            const trackings = await findAllTrackings(db, DOMAIN_1);

            expect(trackings.length).toEqual(1);
            const tracking0 = trackings[0]!;
            // As source linestring is two equal point's -> it's invalid and it should not be saved
            expect(tracking0.geometry).toBeTruthy();
            expect(tracking0.geometry).toEqual(tracking0.last_point);

            Asserter.assertToBeCloseTo(tracking0.last_point.coordinates[0]!, POINT_START[0]!, 0.000001);
            Asserter.assertToBeCloseTo(tracking0.last_point.coordinates[1]!, POINT_START[1]!, 0.000001);
            expect(tracking0.last_point.coordinates[2]).toEqual(0);
        });

        test("updateTrackings and set previous reference", async () => {
            const contractName = "Urakka 1";
            const updated1 = sub(new Date(), { minutes: 15 });
            const updated2 = add(updated1, { minutes: 5 });
            const updated3 = sub(new Date(), { minutes: 2 });

            await insertDomain(db, DOMAIN_1, SOURCE_1);
            await insertDomaindContract(
                db,
                DOMAIN_1,
                CONTRACT_ID,
                contractName,
                SOURCE_1,
                sub(new Date(), { months: 1 }),
                add(new Date(), { months: 1 }),
                updated1
            );
            await insertDomaindTaskMapping(db, HARJA_BRUSHING, AUTORI_OPERATION_BRUSHING, DOMAIN_1, false);
            await insertDomaindTaskMapping(db, HARJA_PAVING, AUTORI_OPERATION_PAVING, DOMAIN_1, false);

            // Create two routes, 2 days and 1 day old
            const coordinates: Position[] = createZigZagCoordinates(
                30,
                AUTORI_MAX_DISTANCE_BETWEEN_TRACKINGS_M - 10
            );
            const coords1 = coordinates.slice(0, 10); //L:10 this end coordinate is the same
            const coords2 = coordinates.slice(9, 14); //L:5 as the start coodinate here.
            const coords3 = coordinates.slice(13, 30); //L:17 And here same for the previous one
            const routes: ApiRouteData[] = [
                AutoriTestutils.createApiRouteData(
                    updated1,
                    [createLineString(coords1)],
                    [AUTORI_OPERATION_BRUSHING]
                ),
                AutoriTestutils.createApiRouteData(
                    updated2,
                    [createLineString(coords2)],
                    [AUTORI_OPERATION_BRUSHING]
                ),
                AutoriTestutils.createApiRouteData(
                    updated3,
                    [createLineString(coords3)],
                    [AUTORI_OPERATION_BRUSHING]
                )
            ];

            mockGetWorkEventsApiResponse(routes);
            await autoriUpdateService.updateTrackingsForDomain(DOMAIN_1);

            const trackings = await findAllTrackings(db, DOMAIN_1);

            expect(trackings.length).toEqual(3);
            // TODO Warning:(295, 33) Error: expect(received).toEqual(expected) // deep equality Expected: null Received: 264
            expect(trackings[0]!.id).toBe(trackings[1]!.previous_tracking_id);
            expect(trackings[1]!.id).toBe(trackings[2]!.previous_tracking_id);
            expect(trackings[0]!.geometry.coordinates.length).toEqual(10);
            expect(trackings[1]!.geometry.coordinates.length).toEqual(5);
            expect(trackings[2]!.geometry.coordinates.length).toEqual(17);
            expect(trackings[2]!.geometry.coordinates.length).toEqual(17);
        });

        function mockGetOperationsApiResponse(response: ApiOperationData[]): void {
            jest.spyOn(AutoriApi.prototype, "getOperations").mockReturnValueOnce(Promise.resolve(response));
        }

        function mockGetContractsApiResponse(response: ApiContractData[]): void {
            jest.spyOn(AutoriApi.prototype, "getContracts").mockReturnValueOnce(Promise.resolve(response));
        }

        function mockGetWorkEventsApiResponse(response: ApiRouteData[]): void {
            jest.spyOn(AutoriApi.prototype, "getNextRouteDataForContract").mockReturnValueOnce(
                Promise.resolve(response)
            );
        }
    })
);
