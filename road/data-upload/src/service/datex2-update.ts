import { SQS } from "@aws-sdk/client-sqs";
import { inDatabase } from "@digitraffic/common/dist/database/database";
import { getEnvVariableSafe } from "@digitraffic/common/dist/utils/utils";
import { deleteOldDataMessages, insertData } from "../dao/data.js";
import type { Datex2UpdateObject } from "../model/datex2-update-object.js";
import type { UpdateObject } from "../model/sqs-message-schema.js";
import { SOURCES, TYPES } from "../model/types.js";

const SQS_URL = getEnvVariableSafe("QUEUE_URL");
const sqs = new SQS({});

export async function deleteOldMessages(): Promise<void> {
  await inDatabase(async (db) => {
    return await deleteOldDataMessages(db);
  });
}

export async function updateRtti(updateObject: UpdateObject): Promise<void> {
  await inDatabase(async (db) => {
    return await Promise.all(
      updateObject.messageVersions.map(async (o) => {
        return await insertData(
          db,
          updateObject.messageId,
          SOURCES.TOPIC,
          o.typeVersion,
          TYPES.RTTI_DATEX2_XML,
          o.messageContent,
        );
      }),
    );
  });

  if (SQS_URL.result === "ok") {
    await sqs.sendMessage({
      MessageBody: JSON.stringify({}), // no data for event, just trigger
      QueueUrl: SQS_URL.value,
    });
  }
}

export async function updateDatex2(
  updateObject: Datex2UpdateObject,
  messageId: string,
): Promise<void> {
  await inDatabase(async (db) => {
    return await Promise.all(
      updateObject.datexIIVersions.map(async (o) => {
        return await insertData(
          db,
          messageId,
          SOURCES.API,
          o.version,
          o.type,
          o.message,
        );
      }),
    );
  });

  if (SQS_URL.result === "ok") {
    await sqs.sendMessage({
      MessageBody: JSON.stringify({}), // no data for event, just trigger
      QueueUrl: SQS_URL.value,
    });
  }
}
