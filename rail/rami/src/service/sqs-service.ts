import { getEnvVariableSafe } from "@digitraffic/common/dist/utils/utils";
import type { Valid } from "./validate-message.js";
import { sendToSqs } from "../util/sqs.js";
import { RamiEnvKeys } from "../keys.js";
import type { UnknownDelayOrTrackMessage } from "../model/dt-rosm-message.js";
import type { DlqMessage } from "../model/dlq-message.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

const ROSM_SQS_URL = getEnvVariableSafe(RamiEnvKeys.ROSM_SQS_URL);
const SM_SQS_URL = getEnvVariableSafe(RamiEnvKeys.SM_SQS_URL);
const UDOT_SQS_URL = getEnvVariableSafe(RamiEnvKeys.UDOT_SQS_URL);
const DLQ_URL = getEnvVariableSafe(RamiEnvKeys.DLQ_URL);

export async function sendRosmMessage(validationResult: Valid<unknown>): Promise<void> {
    if(ROSM_SQS_URL.result === "ok") {
        await sendToSqs(ROSM_SQS_URL.value, JSON.stringify(validationResult.value));
    } else {
        throw new Error(`${RamiEnvKeys.ROSM_SQS_URL} env variable not defined!`);
    }
}

export async function sendSmMessage(message: unknown): Promise<void> {
    if(SM_SQS_URL.result === "ok") {
        await sendToSqs(SM_SQS_URL.value, JSON.stringify(message));
    } else {
        throw new Error(`${RamiEnvKeys.SM_SQS_URL} env variable not defined!`);
    }
}

export async function sendUdotMessage(message: UnknownDelayOrTrackMessage): Promise<void> {
    if(UDOT_SQS_URL.result === "ok") {
        await sendToSqs(UDOT_SQS_URL.value, JSON.stringify(message));
    } else {
        throw new Error(`${RamiEnvKeys.UDOT_SQS_URL} env variable not defined!`);
    }
}

export async function sendDlq(dqlMessage: DlqMessage): Promise<void> {
    if(DLQ_URL.result === "ok") {
        logger.debug("Sending " + JSON.stringify(dqlMessage));
        await sendToSqs(DLQ_URL.value, JSON.stringify(dqlMessage));
    } else {
        throw new Error(`${RamiEnvKeys.DLQ_URL} env variable not defined!`);
    }    
}