import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import type { Countable } from "@digitraffic/common/dist/database/models";
import { dbTestBase as commonDbTestBase } from "@digitraffic/common/dist/test/db-testutils";
import { expect, vi } from "vitest";

export function dbTestBase(fn: (db: DTDatabase) => void): () => void {
  return commonDbTestBase(fn, truncate, "road", "road", "localhost:54322/road");
}

export function mockProxyHolder(): void {
  vi.spyOn(ProxyHolder.prototype, "setCredentials").mockResolvedValue();
}

export async function insertDevice(db: DTDatabase, id: string): Promise<void> {
  await db.none(
    "insert into device(id, type, road_address) values($1, 'TEST', 'TEST')",
    [id],
  );
}

export async function setup(db: DTDatabase): Promise<void> {
  await insertDevice(db, "KRM015651");
  await insertDevice(db, "KRM015511");
}

export async function truncate(db: DTDatabase): Promise<void> {
  await db.none(
    "truncate device, device_data_datex2, device_data_row, device_data cascade",
  );
}

export function assertActiveDeviceCount(
  db: DTDatabase,
  expected: number,
): Promise<void> {
  return db
    .one("select count(*) from device where deleted_date is null")
    .then((value: Countable) => expect(value.count).toEqual(expected));
}

export function assertDeletedDeviceCount(
  db: DTDatabase,
  expected: number,
): Promise<void> {
  return db
    .one("select count(*) from device where deleted_date is not null")
    .then((value: Countable) => expect(value.count).toEqual(expected));
}

export function assertDeviceDataCount(
  db: DTDatabase,
  expected: number,
): Promise<void> {
  return db
    .one("select count(*) from device_data")
    .then((value: Countable) => expect(value.count).toEqual(expected));
}

export function assertDatex2Count(
  db: DTDatabase,
  expected: number,
): Promise<void> {
  return db
    .one("select count(*) from device_data_datex2")
    .then((value: Countable) => expect(value.count).toEqual(expected));
}

export function getUpdatedDate(db: DTDatabase, id: string): Promise<Date> {
  return db
    .one("select modified from device where id = $1", [id])
    .then((value: { modified: Date }) => value.modified);
}
