import { getEnvVariableSafe } from "@digitraffic/common/dist/utils/utils";
import type { Invalid, Valid, ValidatedRamiMessage } from "./validate-message.js";
import { sendToSqs } from "../util/sqs.js";
import { RamiEnvKeys } from "../keys.js";

const ROSM_SQS_URL = getEnvVariableSafe(RamiEnvKeys.ROSM_SQS_URL);
const SM_SQS_URL = getEnvVariableSafe(RamiEnvKeys.SM_SQS_URL);
const DLQ_URL = getEnvVariableSafe(RamiEnvKeys.DLQ_URL);

export async function sendRosmMessage(validationResult: Valid<ValidatedRamiMessage>): Promise<void> {
    const messageId = validationResult.value.payload.messageId;

    if(ROSM_SQS_URL.result === "ok") {
        await sendToSqs(ROSM_SQS_URL.value, 2, JSON.stringify(validationResult.value), messageId);
    } else {
        throw new Error(`${RamiEnvKeys.ROSM_SQS_URL} env variable not defined!`);
    }
}

export async function sendSmMessage(validationResult: Valid<ValidatedRamiMessage>): Promise<void> {
    const messageId = validationResult.value.payload.messageId;

    if(SM_SQS_URL.result === "ok") {
        await sendToSqs(SM_SQS_URL.value, 2, JSON.stringify(validationResult.value), messageId);
    } else {
        throw new Error(`${RamiEnvKeys.SM_SQS_URL} env variable not defined!`);
    }

}

export async function sendDlq(validationResult: Invalid, messageBody: object): Promise<void> {
    if(DLQ_URL.result === "ok") {
        await sendToSqs(DLQ_URL.value, 2, `[{"errors":"${validationResult.errors}"}, ${JSON.stringify(messageBody)}]`);
    } else {
        throw new Error(`${RamiEnvKeys.DLQ_URL} env variable not defined!`);
    }    
}