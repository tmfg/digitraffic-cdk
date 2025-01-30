import { type DTDatabase } from "@digitraffic/common/dist/database/database";
import * as MaintenanceTrackingDb from "../../dao/maintenance-tracking-dao.js";
import * as DbTestutil from "../db-testutil.js";
import * as TestData from "../testdata.js";

describe(
  "db-maintenance-tracking-dao",
  DbTestutil.dbTestBase((db: DTDatabase) => {
    test("insertMaintenanceTrackingData", async () => {
      const maintenanceTrackingDataJson = TestData
        .getTrackingJsonWith3Observations(
          TestData.getRandompId(),
          TestData.getRandompId(),
        );
      const createdObservations = DbTestutil.createObservationsDbDatas(
        maintenanceTrackingDataJson,
      );

      await MaintenanceTrackingDb.insertMaintenanceTrackingObservationData(
        db,
        createdObservations,
      );

      const fetchedObservations = await DbTestutil.findAllObservations(db);
      expect(fetchedObservations.length).toBe(3);

      TestData.assertObservationData(createdObservations, fetchedObservations);
    });

    test("insertMaintenanceTrackingData multiple machines", async () => {
      const maintenanceTrackingDataJson1 = TestData
        .getTrackingJsonWith3Observations(
          TestData.getRandompId(),
          "1",
        );
      const maintenanceTrackingDataJson2 = TestData
        .getTrackingJsonWith3Observations(
          TestData.getRandompId(),
          "2",
        );

      const createdObservations1 = DbTestutil.createObservationsDbDatas(
        maintenanceTrackingDataJson1,
      );
      const createdObservations2 = DbTestutil.createObservationsDbDatas(
        maintenanceTrackingDataJson2,
      );

      await MaintenanceTrackingDb.insertMaintenanceTrackingObservationData(
        db,
        createdObservations1,
      );
      await MaintenanceTrackingDb.insertMaintenanceTrackingObservationData(
        db,
        createdObservations2,
      );

      const fetchedObservations = await DbTestutil.findAllObservations(db);
      expect(fetchedObservations.length).toBe(6);
    });

    test("insertMaintenanceTrackingData with same hash should not be duplicated in db", async () => {
      const json = TestData.getTrackingJsonWith3Observations(
        TestData.getRandompId(),
        TestData.getRandompId(),
      );
      const observationData = DbTestutil.createObservationsDbDatas(json);

      await MaintenanceTrackingDb.insertMaintenanceTrackingObservationData(
        db,
        observationData,
      );
      const fetchedTrackings1 = await DbTestutil.findAllObservations(db);
      expect(fetchedTrackings1.length).toBe(3);

      await MaintenanceTrackingDb.insertMaintenanceTrackingObservationData(
        db,
        observationData,
      );
      const fetchedTrackings2 = await DbTestutil.findAllObservations(db);
      expect(fetchedTrackings2.length).toBe(3);
    });

    test("remove json from DbObservationData", () => {
      const json = '{ "a" : "b" }';
      const data: MaintenanceTrackingDb.DbObservationData[] =
        createDbObservationData();
      // @ts-ignore
      expect(data[0].json).toEqual(json);
      // @ts-ignore
      expect(data[1].json).toEqual(json);
      const clones = MaintenanceTrackingDb.cloneObservationsWithoutJson(data);
      const removed = "{...REMOVED...}";
      // @ts-ignore
      expect(clones[0].json).toEqual(removed);
      // @ts-ignore
      expect(clones[1].json).toEqual(removed);
    });
  }),
);

function createDbObservationData(): MaintenanceTrackingDb.DbObservationData[] {
  return [
    {
      id: BigInt(1),
      observationTime: new Date(),
      sendingTime: new Date(),
      json: '{ "a" : "b" }',
      harjaWorkmachineId: 1,
      harjaContractId: 1,
      sendingSystem: "System1",
      status: MaintenanceTrackingDb.Status.UNHANDLED,
      hash: "abcd",
      s3Uri: "URL",
    },
    {
      id: BigInt(1),
      observationTime: new Date(),
      sendingTime: new Date(),
      json: '{ "a" : "b" }',
      harjaWorkmachineId: 1,
      harjaContractId: 1,
      sendingSystem: "System1",
      status: MaintenanceTrackingDb.Status.UNHANDLED,
      hash: "abcd",
      s3Uri: "URL",
    },
  ];
}
