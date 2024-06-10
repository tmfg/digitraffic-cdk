import * as AjvOrig from "ajv";
import * as addFormatsOrig from "ajv-formats";
import { ramiRosmMessageJsonSchema } from "../model/json-schema/rosm-message.js";
import { ramiSmMessageJsonSchema } from "../model/json-schema/sm-message.js";

interface AjvType {
    // eslint-disable-next-line @typescript-eslint/no-misused-new
    new (options?: { allErrors: boolean }): AjvType;

    addFormat(name: string, format?: string | RegExp): void;
    addKeyword(name: string, definition?: unknown): void;
    validate(schema: unknown, data: unknown): boolean;
    errorsText(): string;
}
const Ajv: AjvType = AjvOrig.default as unknown as AjvType;

type addFormats = (ajv: typeof Ajv) => void;

const addFormats: addFormats = addFormatsOrig.default as unknown as addFormats;

// we can assume id exists if message passes validation
export interface ValidatedRamiMessage {
    payload: {
        messageId: string;
    };
}

export interface Invalid {
    valid: false;
    errors: string;
}
export interface Valid<T> {
    valid: true;
    value: T;
}
export type ValidationResult<T> = Valid<T> | Invalid;

export function validateIncomingRosmMessage(message: unknown): ValidationResult<ValidatedRamiMessage> {
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
    // allow custom field "example" used in the schema
    ajv.addKeyword("example");
    // allow custom format "HH:MM" used in the schema
    ajv.addFormat("HH:MM", /^\d{2}:\d{2}$/);
    return ajv.validate(ramiRosmMessageJsonSchema, message)
        ? { valid: true, value: message as ValidatedRamiMessage }
        : { valid: false, errors: ajv.errorsText() };
}

export function validateIncomingSmMessage(message: unknown): ValidationResult<ValidatedRamiMessage> {
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
    // allow custom field "example" used in the schema
    ajv.addKeyword("example");
    // allow custom format "HH:MM" used in the schema
    ajv.addFormat("HH:MM", /^\d{2}:\d{2}$/);
    return ajv.validate(ramiSmMessageJsonSchema, message)
        ? { valid: true, value: message as ValidatedRamiMessage }
        : { valid: false, errors: ajv.errorsText() };
}