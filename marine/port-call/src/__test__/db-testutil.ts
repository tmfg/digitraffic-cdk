import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { dbTestBase as commonDbTestBase } from "@digitraffic/common/dist/test/db-testutils";
import { jest } from "@jest/globals";
import * as VisitsDAO from "../db/visits.js";
import type { PortCallSecret } from "../model/secret.js";

export function dbTestBase(fn: (db: DTDatabase) => void): () => void {
  return commonDbTestBase(
    fn,
    truncate,
    "marine",
    "marine",
    "127.0.0.1:54321/marine",
  );
}

async function truncate(db: DTDatabase): Promise<void> {
  await db.tx((t) => {
    return t.batch([t.none("DELETE FROM pc2_visit")]);
  });
}

export async function assertVisitCount(
  db: DTDatabase,
  expectedCount: number,
): Promise<void> {
  const visits = await VisitsDAO.findAllVisits(
    db,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
  );
  expect(visits.length).toBe(expectedCount);
}

export function mockProxyAndSecretHolder(): void {
  jest
    .spyOn(ProxyHolder.prototype, "setCredentials")
    .mockImplementation(() => Promise.resolve());
  jest
    .spyOn(SecretHolder.prototype, "get")
    .mockResolvedValue({} as PortCallSecret);
}
