import * as DateValidator from "@digitraffic/common/dist/types/validator";

export interface ValuesQueryParameters {
    month?: number;
    year?: number;
    domain_name: string;
    counter_id: string;
}

export function validate(parameters: ValuesQueryParameters): string | undefined {
    if ((parameters.year && !parameters.month) || (parameters.month && !parameters.year)) {
        return "Both year and month are required";
    }

    if (parameters.year && !DateValidator.validateYear(parameters.year)) {
        return `Year ${parameters.year} must be between ${DateValidator.MIN_YEAR} and ${DateValidator.MAX_YEAR}`;
    }

    if (parameters.month && !DateValidator.validateMonth(parameters.month)) {
        return `Month ${parameters.month} must be between 1 and 12`;
    }

    return undefined;
}
