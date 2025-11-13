import { type ApiPath, IbnetApi } from "../../api/ibnet-api.js";
import type { Deleted, Response } from "../../model/api-db-model.js";
import { jest } from "@jest/globals";
import { DataUpdater } from "../../service/data-updater.js";
import { type TableName } from "../../db/deleted.js";
import { assertCountFromTable, dbTestBase } from "../db-testutil.js";
import { type DTDatabase } from "@digitraffic/common/dist/database/database";

export async function mockApiResponseAndUpdate<T>(
  mockedApiPath: ApiPath,
  response: Response<T>,
  to: number,
): Promise<void> {
  jest.spyOn(IbnetApi.prototype, "getCurrentVersion").mockResolvedValue(to);

  jest.spyOn(IbnetApi.prototype, "fetch").mockImplementation(
    (apiPath: ApiPath, _from: number, _to: number) => {
      const apiResponse = apiPath === mockedApiPath ? response : [];

      return Promise.resolve(apiResponse);
    },
  );

  const updater = new DataUpdater("", "");
  await updater.update();
}

const DELETED_1: Deleted = {
  id: "id1",
  deleted: true,
};

export function createTestFunctions<T extends { rv: number }>(
  tableName: TableName,
  apiPath: ApiPath,
  newObject: T,
  updatedObject: T,
): () => void {
  return dbTestBase((db: DTDatabase) => {
    test(`update empty ${tableName}`, async () => {
      await assertCountFromTable(db, tableName, 0);
      await mockApiResponseAndUpdate(apiPath, [], 0);
      await assertCountFromTable(db, tableName, 0);
    });

    test(`update one ${tableName} then update it`, async () => {
      await assertCountFromTable(db, tableName, 0);
      await mockApiResponseAndUpdate(apiPath, [newObject], newObject.rv);
      await assertCountFromTable(db, tableName, 1);

      await mockApiResponseAndUpdate(
        apiPath,
        [updatedObject],
        updatedObject.rv,
      );
      await assertCountFromTable(db, tableName, 1);
    });

    test(`update one ${tableName} then delete it`, async () => {
      await assertCountFromTable(db, tableName, 0);
      await mockApiResponseAndUpdate(apiPath, [newObject], newObject.rv);
      await assertCountFromTable(db, tableName, 1);

      await mockApiResponseAndUpdate(apiPath, [DELETED_1], newObject.rv + 1);
      await assertCountFromTable(db, tableName, 1, 1);
    });
  });
}
