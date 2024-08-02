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

export interface Invalid {
    valid: false;
    errors: string;
}
export interface Valid<T> {
    valid: true;
    value: T;
}
export type ValidationResult<T> = Valid<T> | Invalid;

export function validateIncomingRosmMessage<T>(message: unknown): ValidationResult<T> {
    return validateWithSchema(ramiRosmMessageJsonSchema, message);
}

export function validateIncomingSmMessage<T>(message: unknown): ValidationResult<T> {
    return validateWithSchema(ramiSmMessageJsonSchema, message);
}

function validateWithSchema<T>(schema: unknown, message: unknown): ValidationResult<T> {
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
    // allow custom field "example" used in the schema
    ajv.addKeyword("example");
    // allow custom format "HH:MM" used in the schema
    ajv.addFormat("HH:MM", /^\d{2}:\d{2}$/);
    return ajv.validate(schema, message)
        ? { valid: true, value: message as T }
        : { valid: false, errors: ajv.errorsText() };

}