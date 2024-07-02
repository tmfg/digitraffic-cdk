export function getErrorMessage(maybeError: unknown): string {
    if (maybeError instanceof Error) {
        return maybeError.name + ": " + maybeError.message;
    }
    return String(maybeError);
}

