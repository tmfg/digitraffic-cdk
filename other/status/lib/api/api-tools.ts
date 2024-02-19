import axios, { AxiosError } from "axios";

export type ErrorOrAxiosError = Error | AxiosError;

export function converToError(error: ErrorOrAxiosError): Error {
    if (axios.isAxiosError(error)) {
        return new Error(
            `{ "name": "${error.name}", "message: "${error.message}", "code": "${
                error.code ?? "-"
            }", "status": "${error.status ?? "-"}", "url": "${
                error.config?.url ?? "-"
            }", "method": "${error.config?.method ?? "-"}", "response": "${
                error.response ? JSON.stringify(error.response) : "-"
            }" }`
        );
    } else {
        return error;
    }
}
