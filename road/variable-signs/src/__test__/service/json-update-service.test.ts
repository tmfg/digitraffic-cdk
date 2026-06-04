import { describe, expect, test } from "vitest";
import type { TloikLaite, TloikMetatiedot } from "../../model/metatiedot.js";
import type {
  TloikLiikennemerkinTila,
  TloikTilatiedot,
} from "../../model/tilatiedot.js";
import * as JsonUpdateService from "../../service/json-update-service.js";
import {
  assertActiveDeviceCount,
  assertDeletedDeviceCount,
  assertDeviceDataCount,
  dbTestBase,
  getUpdatedDate,
} from "../db-testutil.js";

const TEST_DEVICE: TloikLaite = {
  tunnus: "test",
  sijainti: {
    tieosoite: "",
    ajosuunta: "",
    ajorata: "",
    n: 30,
    e: 30,
  },
  tyyppi: "test",
};

const TEST_DEVICE_DATA: TloikLiikennemerkinTila = {
  tunnus: "test",
  voimaan: new Date(),
  rivit: [
    {
      naytto: 1,
      rivi: 1,
      teksti: "row1",
    },
    {
      naytto: 1,
      rivi: 2,
      teksti: "row2",
    },
  ],
  luotettavuus: "12",
};

describe(
  "json-update-service-tests",
  dbTestBase((db) => {
    test("update metadata - empty", async () => {
      const metadata: TloikMetatiedot = { laitteet: [] };
      await JsonUpdateService.updateJsonMetadata(metadata);

      await assertActiveDeviceCount(db, 0);
    });

    test("update metadata - insert one device", async () => {
      const metadata: TloikMetatiedot = { laitteet: [TEST_DEVICE] };
      await JsonUpdateService.updateJsonMetadata(metadata);

      await assertActiveDeviceCount(db, 1);
    });

    test("update metadata - insert then update", async () => {
      // first insert
      const metadata: TloikMetatiedot = { laitteet: [TEST_DEVICE] };
      await JsonUpdateService.updateJsonMetadata(metadata);

      await assertActiveDeviceCount(db, 1);
      const created = await getUpdatedDate(db, "test");

      await new Promise((resolve) => setTimeout(resolve, 1000));

      // then update
      metadata.laitteet[0]!.sijainti.ajorata = "vasen";
      await JsonUpdateService.updateJsonMetadata(metadata);
      const updated = await getUpdatedDate(db, "test");

      await assertActiveDeviceCount(db, 1);
      expect(updated.getTime()).toBeGreaterThan(created.getTime());
    });

    test("update metadata - insert then remove then insert", async () => {
      // first insert
      const metadata: TloikMetatiedot = { laitteet: [TEST_DEVICE] };
      await JsonUpdateService.updateJsonMetadata(metadata);

      await assertActiveDeviceCount(db, 1);
      await assertDeletedDeviceCount(db, 0);

      // then remove
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await JsonUpdateService.updateJsonMetadata({ laitteet: [] });

      await assertActiveDeviceCount(db, 0);
      await assertDeletedDeviceCount(db, 1);

      // then insert again
      await JsonUpdateService.updateJsonMetadata(metadata);

      await assertActiveDeviceCount(db, 1);
      await assertDeletedDeviceCount(db, 0);
    });

    test("update data - empty", async () => {
      const tilatiedot: TloikTilatiedot = { liikennemerkit: [] };
      await JsonUpdateService.updateJsonData(tilatiedot);

      await assertDeviceDataCount(db, 0);
    });

    test("update data - one", async () => {
      const tilatiedot: TloikTilatiedot = {
        liikennemerkit: [TEST_DEVICE_DATA],
      };
      await JsonUpdateService.updateJsonData(tilatiedot);

      await assertDeviceDataCount(db, 1);
    });

    test("update data - multiple devices with rows", async () => {
      const second: TloikLiikennemerkinTila = {
        tunnus: "test2",
        voimaan: new Date(),
        rivit: [{ naytto: 1, rivi: 1, teksti: "second-row1" }],
        luotettavuus: "12",
      };

      const tilatiedot: TloikTilatiedot = {
        liikennemerkit: [TEST_DEVICE_DATA, second],
      };
      await JsonUpdateService.updateJsonData(tilatiedot);

      await assertDeviceDataCount(db, 2);
    });
  }),
);
