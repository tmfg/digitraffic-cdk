import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { describe, expect, test } from "vitest";
import {
  findControllersDatex2_35,
  findControllersDatex2_37,
  findSituationsDatex2_35,
  findSituationsDatex2_37,
  findSituationsDatex2_223,
  findStatusesDatex2_35,
  findStatusesDatex2_37,
} from "../../service/variable-signs.js";
import { dbTestBase, insertDevice } from "../db-testutil.js";

async function insertDatex2(
  db: DTDatabase,
  deviceId: string,
  datex2: string,
  type: string,
  version: string,
): Promise<void> {
  await db.none(
    "insert into device_data_datex2(device_id, datex2, effect_date, type, version) values($1, $2, now(), $3, $4)",
    [deviceId, datex2, type, version],
  );
}

describe(
  "variable-signs-service-tests",
  dbTestBase((db: DTDatabase) => {
    // ── 3.5 situations ──────────────────────────────────────────────────────

    test("findSituationsDatex2_35 - empty returns template", async () => {
      const [xml, lastModified] = await findSituationsDatex2_35();

      expect(xml).toContain("<sit:situationPublication");
      expect(xml).not.toContain("<sit:situation ");
      expect(lastModified).toBeInstanceOf(Date);
    });

    test("findSituationsDatex2_35 - already namespaced data is passed through", async () => {
      await insertDevice(db, "DEV_SIT35_1");
      await insertDatex2(
        db,
        "DEV_SIT35_1",
        "<sit:situation>test</sit:situation>",
        "SITUATION",
        "DATEXII_3_5",
      );

      const [xml] = await findSituationsDatex2_35();

      expect(xml).toContain("<sit:situationPublication");
      expect(xml).toContain("<sit:situation>test</sit:situation>");
    });

    test("findSituationsDatex2_35 - adds sit: namespace when missing", async () => {
      await insertDevice(db, "DEV_SIT35_2");
      await insertDatex2(
        db,
        "DEV_SIT35_2",
        "<situation>bare</situation>",
        "SITUATION",
        "DATEXII_3_5",
      );

      const [xml] = await findSituationsDatex2_35();

      expect(xml).toContain("<sit:situation>bare</sit:situation>");
    });

    // ── 3.5 controller statuses ─────────────────────────────────────────────

    test("findStatusesDatex2_35 - with data", async () => {
      await insertDevice(db, "DEV_ST35_1");
      await insertDatex2(
        db,
        "DEV_ST35_1",
        "<vms:vmsControllerStatus>s</vms:vmsControllerStatus>",
        "CONTROLLER_STATUS",
        "DATEXII_3_5",
      );

      const [xml] = await findStatusesDatex2_35();

      expect(xml).toContain('xsi:type="vms:VmsPublication"');
      expect(xml).toContain(
        "<vms:vmsControllerStatus>s</vms:vmsControllerStatus>",
      );
    });

    test("findStatusesDatex2_35 - adds vms: namespace when missing", async () => {
      await insertDevice(db, "DEV_ST35_2");
      await insertDatex2(
        db,
        "DEV_ST35_2",
        "<vmsControllerStatus>s</vmsControllerStatus>",
        "CONTROLLER_STATUS",
        "DATEXII_3_5",
      );

      const [xml] = await findStatusesDatex2_35();

      expect(xml).toContain(
        "<vms:vmsControllerStatus>s</vms:vmsControllerStatus>",
      );
    });

    // ── 3.5 controllers ─────────────────────────────────────────────────────

    test("findControllersDatex2_35 - with data", async () => {
      await insertDevice(db, "DEV_CT35_1");
      await insertDatex2(
        db,
        "DEV_CT35_1",
        "<vms:vmsController>c</vms:vmsController>",
        "CONTROLLER",
        "DATEXII_3_5",
      );

      const [xml] = await findControllersDatex2_35();

      expect(xml).toContain('xsi:type="vms:VmsTablePublication"');
      expect(xml).toContain("<vms:vmsController>c</vms:vmsController>");
    });

    test("findControllersDatex2_35 - adds vms: namespace when missing", async () => {
      await insertDevice(db, "DEV_CT35_2");
      await insertDatex2(
        db,
        "DEV_CT35_2",
        "<vmsController>c</vmsController>",
        "CONTROLLER",
        "DATEXII_3_5",
      );

      const [xml] = await findControllersDatex2_35();

      expect(xml).toContain("<vms:vmsController>c</vms:vmsController>");
    });

    // ── 2.2.3 situations ────────────────────────────────────────────────────

    test("findSituationsDatex2_223 - with data", async () => {
      await insertDevice(db, "DEV_223_1");
      await insertDatex2(
        db,
        "DEV_223_1",
        "<situation>s223</situation>",
        "SITUATION",
        "DATEXII_2_2_3",
      );

      const [xml] = await findSituationsDatex2_223();

      expect(xml).toContain('xsi:type="SituationPublication"');
      expect(xml).toContain("<situation>s223</situation>");
    });

    // ── 3.7 situations ──────────────────────────────────────────────────────

    test("findSituationsDatex2_37 - empty returns 3.7 template with olrb namespace", async () => {
      const [xml, lastModified] = await findSituationsDatex2_37();

      expect(xml).toContain("<sit:situationPublication");
      expect(xml).toContain(
        'xmlns:olrb="http://datex2.eu/schema/3/openLrBinary"',
      );
      expect(lastModified).toBeInstanceOf(Date);
    });

    test("findSituationsDatex2_37 - with data", async () => {
      await insertDevice(db, "DEV_SIT37_1");
      await insertDatex2(
        db,
        "DEV_SIT37_1",
        "<sit:situation>t37</sit:situation>",
        "SITUATION",
        "DATEXII_3_7",
      );

      const [xml] = await findSituationsDatex2_37();

      expect(xml).toContain("<sit:situationPublication");
      expect(xml).toContain(
        'xmlns:olrb="http://datex2.eu/schema/3/openLrBinary"',
      );
      expect(xml).toContain("<sit:situation>t37</sit:situation>");
    });

    // ── 3.7 controller statuses ─────────────────────────────────────────────

    test("findStatusesDatex2_37 - with data", async () => {
      await insertDevice(db, "DEV_ST37_1");
      await insertDatex2(
        db,
        "DEV_ST37_1",
        "<vms:vmsControllerStatus>s37</vms:vmsControllerStatus>",
        "CONTROLLER_STATUS",
        "DATEXII_3_7",
      );

      const [xml] = await findStatusesDatex2_37();

      expect(xml).toContain('xsi:type="vms:VmsPublication"');
      expect(xml).toContain(
        'xmlns:olrb="http://datex2.eu/schema/3/openLrBinary"',
      );
      expect(xml).toContain(
        "<vms:vmsControllerStatus>s37</vms:vmsControllerStatus>",
      );
    });

    // ── 3.7 controllers ─────────────────────────────────────────────────────

    test("findControllersDatex2_37 - with data", async () => {
      await insertDevice(db, "DEV_CT37_1");
      await insertDatex2(
        db,
        "DEV_CT37_1",
        "<vms:vmsController>c37</vms:vmsController>",
        "CONTROLLER",
        "DATEXII_3_7",
      );

      const [xml] = await findControllersDatex2_37();

      expect(xml).toContain('xsi:type="vms:VmsTablePublication"');
      expect(xml).toContain(
        'xmlns:olrb="http://datex2.eu/schema/3/openLrBinary"',
      );
      expect(xml).toContain("<vms:vmsController>c37</vms:vmsController>");
    });
  }),
);
