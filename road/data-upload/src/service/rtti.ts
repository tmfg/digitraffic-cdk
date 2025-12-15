import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { inDatabase, type DTDatabase } from "@digitraffic/common/dist/database/database";
import { getNewData, updateStatus, type DataIncomingDb } from "../dao/data.js";
import { Datex2Version, SOURCES, TYPES } from "../model/types.js";
import { logException } from "@digitraffic/common/dist/utils/logging";
import { parseRtti35 } from "./rtti-35-parser.js";
import { updateRtti } from "../dao/rtti.js";
import { SQS } from "@aws-sdk/client-sqs";
import { getEnvVariableSafe } from "@digitraffic/common/dist/utils/utils";

const SQS_URL = getEnvVariableSafe("MQTT_QUEUE_URL");
const sqs = new SQS({});

export async function handleRttiMessages(): Promise<void> {
    const method = "RttiService.handleRttiMessages" as const;

    await inDatabase(async (db) => {
        const unhandled = await getNewData(db, SOURCES.TOPIC, [
            TYPES.RTTI_DATEX2_XML,
        ]);

        await Promise.allSettled(unhandled.map(async (data) => {
            logger.debug(`Handling variable sign data id ${data.data_id}`);

            try {
                await handleRtti(db, data);

                await updateStatus(db, data.data_id, "PROCESSED");
            } catch (error) {
                logger.debug(data.data);

                logger.error({
                    method,
                    error,
                });

                await updateStatus(db, data.data_id, "FAILED");
            }
        }));
    });
}
async function handleRtti(db: DTDatabase, data: DataIncomingDb) {
    const method = "RttiService.handleRtti" as const;
    const started = Date.now();

    let unknownCount = 0;
    let updated35Count = 0;
    let error35Count = 0;
    
    switch (data.version) {
        case "3.5":
            const s = await parseRtti35(data.data);

            try {
                logger.debug("Updating RTTI situation " + JSON.stringify(s));
                updated35Count++;
                await updateRtti(db, s.situationId, s.type, s.publicationTime, s.geometry, s.startTime, s.endTime, s.isSrti, s.message);

                if (SQS_URL.result === "ok") {
                    await sqs.sendMessage({
                        MessageBody: JSON.stringify({
                            id: s.situationId
                        }),
                        QueueUrl: SQS_URL.value,
                    });
                } else {
                    logger.debug("Skipping MQTT message sending, no SQS URL configured");
                }
            } catch (error) {
                logException(logger, error);
                error35Count++;
            }

            break;
        default:  
            unknownCount++;

            logger.error({
                method,
                message: `Unknown rtti datex version ${data.version}`,
            });  
    }

    logger.info({
    method,
    customDatexVersion: Datex2Version["3.5"],
    customUpdatedCount: updated35Count,
    customErrorCount: error35Count,
  });

  logger.info({
    method,
    customUnknownCount: unknownCount,
    tookMs: Date.now() - started,
  });
}
