import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import type { Invalid, Valid, ValidatedRamiMessage } from "./validate-message.js";
import { sendToSqs } from "../util/sqs.js";
import { RamiEnvKeys } from "../keys.js";

const ROSM_SQS_URL = getEnvVariable(RamiEnvKeys.ROSM_SQS_URL);
const SM_SQS_URL = getEnvVariable(RamiEnvKeys.SM_SQS_URL);
const DLQ_URL = getEnvVariable(RamiEnvKeys.DLQ_URL);

export async function sendRosmMessage(validationResult: Valid<ValidatedRamiMessage>): Promise<void> {
    const messageId = validationResult.value.payload.messageId;

    await sendToSqs(ROSM_SQS_URL, 2, JSON.stringify(validationResult.value), messageId);
}

export async function sendSmMessage(validationResult: Valid<ValidatedRamiMessage>): Promise<void> {
    const messageId = validationResult.value.payload.messageId;

    await sendToSqs(SM_SQS_URL, 2, JSON.stringify(validationResult.value), messageId);
}

export async function sendDlq(validationResult: Invalid, messageBody: object): Promise<void> {
    await sendToSqs(DLQ_URL, 2,
        `[{"errors":"${validationResult.errors}"}, ${JSON.stringify(messageBody)}]`
    );
}