import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { deleteOldDataMessages, insertData } from "../dao/data.js";
import {
  inDatabase,
  inDatabaseReadonly,
} from "@digitraffic/common/dist/database/database";
import { type Datex2UpdateObject } from "../model/datex2-update-object.js";
import { v4 } from "uuid";
import { SOURCES } from "../model/types.js";
import { getEnvVariableSafe } from "@digitraffic/common/dist/utils/utils";
import { SQS } from "@aws-sdk/client-sqs";

const SQS_URL = getEnvVariableSafe("QUEUE_URL");
const sqs = new SQS({});

export async function deleteOldMessages(): Promise<void> {
  await inDatabase(async (db) => {
    return await deleteOldDataMessages(db);
  });
}

export async function updateDatex2(
  updateObject: Datex2UpdateObject,
): Promise<void> {
  logger.debug(updateObject);

  const messageId = v4();

  await inDatabaseReadonly((db) => {
    return Promise.all(updateObject.datexIIVersions.map(async (o) => {
      return await insertData(
        db,
        messageId,
        SOURCES.API,
        o.version,
        o.type,
        o.message,
      );
    }));
  });

  if (SQS_URL.result === "ok") {
    await sqs.sendMessage({
      MessageBody: JSON.stringify({}), // no data for event, just trigger
      QueueUrl: SQS_URL.value,
    });
  }
}
