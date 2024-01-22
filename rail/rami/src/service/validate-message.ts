import Ajv from "ajv";
import addFormats from "ajv-formats";
import { ramiMessageJsonSchema } from "../model/json-schema/rami-message.js";

// we can assume id exists if message passes validation
interface ValidatedRamiMessage {
    payload: {
        messageId: string;
    };
}

interface Invalid {
    valid: false;
    errors: string;
}
interface Valid<T> {
    valid: true;
    value: T;
}
type ValidationResult<T> = Valid<T> | Invalid;

export function validateIncomingRamiMessage(message: unknown): ValidationResult<ValidatedRamiMessage> {
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
    // allow custom field "example" used in the schema
    ajv.addKeyword("example");
    // allow custom format "HH:MM" used in the schema
    ajv.addFormat("HH:MM", /^\d{2}:\d{2}$/);
    return ajv.validate(ramiMessageJsonSchema, message)
        ? { valid: true, value: message as ValidatedRamiMessage }
        : { valid: false, errors: ajv.errorsText() };
}
