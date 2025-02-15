import * as FaultsService from "../../service/faults.js";
import * as WarningsService from "../../service/warnings.js";
import * as S124Converter from "../../service/s124-converter.js";
import { VisService } from "../../service/vis.js";
import {
  S124Type,
  type SendS124Event,
} from "../../model/upload-voyageplan-event.js";
import type { AtonSecret } from "../../model/secret.js";
import { decodeBase64ToAscii } from "@digitraffic/common/dist/utils/base64";
import type { SQSEvent } from "aws-lambda";
import {
  type DTDatabase,
  inDatabaseReadonly,
} from "@digitraffic/common/dist/database/database";
import { Builder } from "xml2js";
import middy from "@middy/core";
import sqsPartialBatchFailureMiddleware from "@middy/sqs-partial-batch-failure";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

let visService: VisService | undefined;

const secretHolder = SecretHolder.create<AtonSecret>("aton");
const proxyHolder = ProxyHolder.create();

/**
 * This handler should only receive and send a single S124-message
 */
export function handlerFn(): (event: SQSEvent) => Promise<void> {
  return async (event: SQSEvent): Promise<void> => {
    await proxyHolder
      .setCredentials()
      .then(() => secretHolder.get())
      .then(async (secret) => {
        if (!visService) {
          // certificates are stored as base64 to prevent Secrets Manager from stripping line breaks

          const clientCertificate = decodeSecretValue(secret.certificate);
          const privateKey = decodeSecretValue(secret.privatekey);
          const caCert = decodeSecretValue(secret.ca);
          visService = new VisService(caCert, clientCertificate, privateKey);
        }

        await inDatabaseReadonly((db: DTDatabase) => {
          return Promise.allSettled(
            event.Records.map((r) => JSON.parse(r.body) as SendS124Event)
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- visService is defined, end of story
              .map((e) => handleEvent(db, e, visService!)),
          );
        });
      });
  };
}

function decodeSecretValue(value: string): string {
  // for tests, no need to inject base64-stuff into secret
  if (!value) {
    return "";
  }

  return decodeBase64ToAscii(value);
}

function handleEvent(
  db: DTDatabase,
  event: SendS124Event,
  visService: VisService,
): Promise<void> {
  switch (event.type) {
    case S124Type.FAULT:
      return FaultsService.getFaultS124ById(db, event.id).then((faultsS124) => {
        if (faultsS124) {
          return visService.sendFault(faultsS124, event.callbackEndpoint);
        }

        logger.info({
          method: "SendS124.handler",
          message: `Fault not found with id ${event.id}`,
        });
        return Promise.reject();
      });

    case S124Type.WARNING:
      return WarningsService.findWarning(db, event.id).then((warning) => {
        if (warning) {
          const xml = new Builder().buildObject(
            S124Converter.convertWarning(warning),
          );
          return visService.sendWarning(xml, event.callbackEndpoint);
        }
        logger.info({
          method: "SendS124.handler",
          message: `Warning with id ${event.id} was not found`,
        });
        return Promise.reject();
      });
  }
}

export const handler = middy(handlerFn()).use(
  sqsPartialBatchFailureMiddleware(),
);
