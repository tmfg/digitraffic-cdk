export type ValuesQueryParameters = {
    month?: number;
    year?: number;
    domainName: string;
    counterId: string;
}

export function validate(parameters: ValuesQueryParameters): string | null {
    if ((parameters.year && !parameters.month) || (parameters.month && !parameters.year)) {
        return 'Both year and month are required';
    }

    return null;
}

